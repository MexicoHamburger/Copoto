package com.copoto.project.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.copoto.project.entity.RefreshToken;
import com.copoto.project.entity.User;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    @Modifying
    @Transactional
    @Query("delete from RefreshToken rt where rt.user = :user")
    void deleteByUser(@Param("user") User user);


    Optional<RefreshToken> findByUser(User user);

    // // 추가: 사용자 ID + deviceInfo로 조회
    // Optional<RefreshToken> findByUserIdAndDeviceInfo(String userId, String deviceInfo);
}
