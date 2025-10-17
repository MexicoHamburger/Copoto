package com.copoto.project.security;

import java.io.IOException;
import java.util.Collections;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.copoto.project.entity.User;
import com.copoto.project.service.UserService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, UserService userService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userService = userService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain filterChain) throws ServletException, IOException {

        // 모든 GET 요청을 인증 검증 없이 통과시킴
        // if ("GET".equalsIgnoreCase(request.getMethod())) {
        //     filterChain.doFilter(request, response);
        //     return;
        // }
        
        String header = request.getHeader("Authorization");
        logger.debug("JwtAuthenticationFilter - Authorization header: {}" + header); // 적절함

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtTokenProvider.validateToken(token)) {
                String userId = jwtTokenProvider.getUserIdFromToken(token);
                User user = userService.getUserById(userId);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(user, null, Collections.emptyList());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.debug("JwtAuthenticationFilter - User authenticated: {}" + userId);
            } else {
                logger.warn("JwtAuthenticationFilter - Invalid JWT token");
            }
        } else {
            logger.debug("JwtAuthenticationFilter - No JWT token found in request");
        }
        filterChain.doFilter(request, response);
    }
}
