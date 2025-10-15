package com.copoto.project.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.copoto.project.entity.Comment;
import com.copoto.project.entity.Post;
import com.copoto.project.entity.User;
import com.copoto.project.repository.CommentRepository;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    // 댓글 생성 (Create)
    public Comment createComment(Comment comment, Post post, User user) {
        comment.setPost(post);
        comment.setUser(user);
        return commentRepository.save(comment);
    }

    // 특정 댓글 조회 (Read)
    public Comment getCommentById(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
    }

    // 특정 게시글의 모든 댓글 조회 (Read)
    public List<Comment> getCommentsByPost(Post post) {
        return commentRepository.findAll().stream()
                .filter(comment -> comment.getPost().equals(post))
                .toList();
    }

    // 특정 유저의 모든 댓글 조회 (Read)
    public List<Comment> getCommentsByUser(User user) {
        return commentRepository.findAll().stream()
                .filter(post -> post.getUser().equals(user))
                .toList();
    }

    // 댓글 수정 (Update)
    public Comment updateComment(Long commentId, String newContent) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        comment.setContent(newContent);
        return commentRepository.save(comment);
    }

    // 댓글 삭제 (Delete)
    public void deleteComment(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new IllegalArgumentException("Comment not found");
        }
        commentRepository.deleteById(commentId);
    }
}
