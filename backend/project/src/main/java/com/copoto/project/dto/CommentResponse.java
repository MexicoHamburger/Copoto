package com.copoto.project.dto;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "댓글 조회/응답 DTO")
public class CommentResponse {
    @Schema(description = "댓글 ID", example = "1")
    private Long commentId;

    @Schema(description = "댓글 내용", example = "좋은 글 감사합니다.")
    private String content;

     @Schema(description = "작성자 ID", example = "123")
    private String userId;

    @Schema(description = "게시글 ID", example = "456")
    private Long postId;

    @Schema(description = "작성일시", example = "2025-10-14T12:34:56")
    private LocalDateTime createdAt;

    @Schema(description = "혐오 발언 여부", example = "false")
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
