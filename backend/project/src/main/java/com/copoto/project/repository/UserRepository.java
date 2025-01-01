package com.copoto.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.copoto.project.entity.User;

public interface UserRepository extends JpaRepository<User, String> {
    // 추가 메서드가 필요하면 여기 작성
}
