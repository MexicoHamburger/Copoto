package com.copoto.project.dto.post;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "게시글 삭제 요청 DTO")
public class PostDeleteRequest {

    @Schema(description = "게시글 ID", example = "123", required = true)
    private Long postId;

    // Getter and Setter
    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }
}
