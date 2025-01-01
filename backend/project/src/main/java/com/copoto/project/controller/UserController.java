package com.copoto.project.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.copoto.project.dto.ApiResponse;
import com.copoto.project.dto.LoginRequest;
import com.copoto.project.dto.RegisterRequest;
import com.copoto.project.dto.UserResponse;
import com.copoto.project.entity.User;
import com.copoto.project.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:3000") // React의 도메인 주소
@Tag(name = "User API", description = "회원 관리 API")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    @Operation(summary = "회원 가입", description = "새로운 회원을 등록합니다.")
    public ResponseEntity<ApiResponse<UserResponse>> register(@RequestBody RegisterRequest request) {
        User user = new User();
        user.setId(request.getId());
        user.setPassword(request.getPassword());
        User registeredUser = userService.register(user);

        UserResponse response = new UserResponse();
        response.setId(registeredUser.getId());
        response.setPassword(registeredUser.getPassword());
        response.setCreatedAt(registeredUser.getCreatedAt());

        return ResponseEntity.ok(new ApiResponse<>(200, "User registered successfully", response));
    }

    @PostMapping("/login")
    @Operation(summary = "로그인", description = "회원 로그인 기능을 제공합니다.")
    public ResponseEntity<ApiResponse<String>> login(@RequestBody LoginRequest request) {
        User loggedInUser = userService.login(request.getId(), request.getPassword());
        if (loggedInUser != null) {
            return ResponseEntity.ok(new ApiResponse<>(200, "Login successful", null));
        } else {
            return ResponseEntity.status(401).body(new ApiResponse<>(401, "Invalid credentials", null));
        }
    }

    @GetMapping("/all")
    @Operation(summary = "전체 회원 조회", description = "모든 회원 정보를 반환합니다.")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers().stream().map(user -> {
            UserResponse response = new UserResponse();
            response.setId(user.getId());
            response.setPassword(user.getPassword());
            response.setCreatedAt(user.getCreatedAt());
            return response;
        }).toList();

        return ResponseEntity.ok(new ApiResponse<>(200, "Fetched all users", users));
    }
}
