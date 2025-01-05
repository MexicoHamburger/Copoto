package com.copoto.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.copoto.project.entity.Comment;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
}
