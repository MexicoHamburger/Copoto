package com.copoto.project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.copoto.project.entity.Post;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    // 게시판 별 게시글 조회
    List<Post> findByType(String type);
}
