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
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        post.setView_count(post.getView_count() + 1L);
        return postRepository.save(post);
    }

    // 특정 게시판의 게시글 조회 (Read)
    public List<Post> getPostsByType(String type) {
        return postRepository.findByType(type);
    }

    // 모든 게시글 조회 (Read)
    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    // 게시글 수정 (Update)
    public Post updatePost(Long postId, String newTitle, String newContents, String newType, User user) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        // 본인만 수정 가능하도록 체크
        if (!post.getUser().getId().equals(user.getId())) {
            throw new SecurityException("You are not allowed to edit this post.");
        }
        post.setTitle(newTitle);
        post.setContents(newContents);
        post.setType(newType);
        return postRepository.save(post);
    }


    // 게시글 삭제 (Delete)
    public void deletePost(Long postId, User user) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        System.out.println("삭제 요청 userId: " + user.getId());
        System.out.println("게시글 userId: " + post.getUser().getId());
        if (!post.getUser().getId().equals(user.getId())) {
            throw new SecurityException("You are not allowed to delete this post.");
        }
        postRepository.deleteById(postId);
    }

}
