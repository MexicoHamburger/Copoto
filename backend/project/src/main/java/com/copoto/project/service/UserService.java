package com.copoto.project.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.copoto.project.entity.User;
import com.copoto.project.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User register(User user) {
        // ID 중복 체크
        if (userRepository.existsById(user.getId())) {
            throw new IllegalArgumentException("ID already exists");
        }
        return userRepository.save(user);
    }

    public User login(String id, String password) {
        return userRepository.findById(id)
                .filter(user -> user.getPassword().equals(password)) // 간단한 비교, 추후 암호화 적용 필요
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
}
