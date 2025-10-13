package com.copoto.project.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.copoto.project.entity.Post;
import com.copoto.project.entity.User;
import com.copoto.project.repository.PostRepository;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    // 게시글 생성 (Create)
    public Post createPost(Post post, User user) {
        post.setUser(user);
        return postRepository.save(post);
    }

    // 특정 게시글 조회 (Read)
    public Post getPostById(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
    }

    // 모든 게시글 조회 (Read)
    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    // 게시글 수정 (Update)
    public Post updatePost(Long postId, String newTitle, String newContents) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        post.setTitle(newTitle);
        post.setContents(newContents);
        return postRepository.save(post);
    }

    // 게시글 삭제 (Delete)
    public void deletePost(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("Post not found");
        }
        postRepository.deleteById(postId);
    }
}
