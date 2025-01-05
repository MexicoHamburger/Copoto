package com.copoto.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.copoto.project.entity.Post;

@Repository
public interface PostRepository extends JpaRepository<Post, String> {
}
