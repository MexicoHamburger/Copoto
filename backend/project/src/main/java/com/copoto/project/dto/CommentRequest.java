package com.copoto.project.dto;

public class CommentRequest {
    private String userId;
    private Long postId;
    private String content;

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
