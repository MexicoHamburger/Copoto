package com.copoto.project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.copoto.project.entity.TempPost;
import com.copoto.project.entity.User;

@Repository
public interface TempPostRepository extends JpaRepository<TempPost, Long> {
    List<TempPost> findByUserOrderByCreatedAtAsc(User user);
    List<TempPost> findByUserOrderByCreatedAtDesc(User user);
    long countByUser(User user);
}
