package com.copoto.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;


@Schema(description = "댓글 등록 요청 DTO")
public class CommentRequest {
    // @Schema(description = "작성자 ID", example = "sc9335", required = true)
    // private String userId;
    @Schema(description = "게시글 ID", example = "3", required = true)
    private Long postId;
    @Schema(description = "댓글 내용", example = "정상 댓글입니다.", required = true)
    private String content;

    // public String getUserId() { return userId; }
    // public void setUserId(String userId) { this.userId = userId; }
    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
