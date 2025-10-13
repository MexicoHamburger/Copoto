package com.copoto.project.dto.post;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "게시글 수정 요청 DTO")
public class PostUpdateRequest {

    @Schema(description = "게시글 ID", example = "123", required = true)
    private Long postId;

    @Schema(description = "게시글 제목", example = "Updated title of the post", required = true)
    private String title;      // 추가

    @Schema(description = "게시글 내용", example = "Updated content of the post.", required = true)
    private String contents;

    // Getter and Setter
    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContents() {
        return contents;
    }

    public void setContents(String contents) {
        this.contents = contents;
    }
}
