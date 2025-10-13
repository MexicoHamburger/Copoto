package com.copoto.project.dto;

import java.time.LocalDateTime;

public class CommentResponse {
    private Long commentId;
    private String content;
    private String userId;
    private Long postId;
    private LocalDateTime createdAt;
    private Boolean hateSpeech; // 추가

    public Long getCommentId() { return commentId; }
    public void setCommentId(Long commentId) { this.commentId = commentId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Boolean getHateSpeech() { return hateSpeech; }
    public void setHateSpeech(Boolean hateSpeech) { this.hateSpeech = hateSpeech; }
}
