package com.copoto.project.dto.post;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "게시글 응답 DTO")
public class PostResponse {

    @Schema(description = "게시글 ID", example = "11")
    private Long postId;

    @Schema(description = "게시글 제목", example = "My First Post")
    private String title;

    @Schema(description = "게시글 내용", example = "This is the content of the post.")
    private String contents;

    @Schema(description = "작성자 ID", example = "user1")
    private String userId;

    @Schema(description = "게시글 생성 시간", example = "2023-01-01T12:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "게시글 수정 시간", example = "2023-01-02T12:00:00")
    private LocalDateTime updatedAt;

    @Schema(description = "혐오 발언 여부", example = "false")
    private Boolean hateSpeech; // 추가

    // Getter and Setter
    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContents() {
        return contents;
    }

    public void setContents(String contents) {
        this.contents = contents;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getHateSpeech() { return hateSpeech; }
    public void setHateSpeech(Boolean hateSpeech) { this.hateSpeech = hateSpeech; }
}
