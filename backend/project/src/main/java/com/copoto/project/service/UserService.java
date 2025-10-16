package com.copoto.project.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.copoto.project.entity.RefreshToken;
import com.copoto.project.entity.User;
import com.copoto.project.repository.RefreshTokenRepository;
import com.copoto.project.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    // 비밀번호 암호화기 인스턴스 선언
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User register(User user) {
        if (userRepository.existsById(user.getId())) {
            throw new IllegalArgumentException("ID already exists");
        }
        // <<< 비밀번호 암호화 후 저장 >>>
        String encodedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encodedPassword);
        return userRepository.save(user);
    }

    public User login(String id, String rawPassword) {
        return userRepository.findById(id)
                .filter(user -> passwordEncoder.matches(rawPassword, user.getPassword()))
                .orElse(null);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // 사용자 ID로 조회
    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));
    }

    // 닉네임 수정 (Update)
    @Transactional
    public User updateNickname(String userId, String newNickname) {
        // 닉네임 중복 검사
        if (userRepository.existsByNickname(newNickname)) {
            throw new IllegalArgumentException("Nickname is already in use");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        user.setNickname(newNickname);
        return userRepository.save(user);
    }

    // 비밀번호 수정 (Update)
    @Transactional
    public void updatePassword(String userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // 현재 비밀번호 확인
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password does not match");
        }
        
        // 새 비밀번호 암호화 및 설정
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // 단일 리프레시 토큰 관리(기존 토큰 삭제 후 새 토큰 발급)
    @Transactional(propagation = Propagation.REQUIRED)
    public RefreshToken createRefreshToken(User user) {
        System.out.println("delete refresh token start for user: " + user.getId());
        refreshTokenRepository.deleteByUser(user);
        System.out.println("delete refresh token done for user: " + user.getId());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(Instant.now().plus(7, ChronoUnit.DAYS));
        refreshToken.setToken(UUID.randomUUID().toString());

        System.out.println("saving new refresh token: " + refreshToken.getToken());
        return refreshTokenRepository.save(refreshToken);
    }



    @Transactional
    public void deleteRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    public boolean isRefreshTokenExpired(RefreshToken token) {
        return token.getExpiryDate().isBefore(Instant.now());
    }
}
