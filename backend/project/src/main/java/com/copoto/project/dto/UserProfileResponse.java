package com.copoto.project.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.copoto.project.dto.post.PostResponse;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class UserProfileResponse {
    @Schema(description = "사용자 ID", example = "user1")
    private String id;

    @Schema(description = "닉네임", example = "SKKUniv쓲빢", required = true)
    private String nickname;

    @Schema(description = "생성 일시", example = "2025-01-01T13:11:23.703Z")
    private LocalDateTime createdAt;

    @Schema(description = "작성한 게시물들", example = "")
    private List<PostResponse> posts;

    @Schema(description = "작성한 댓글들", example = "")
    private List<CommentResponse> comments;
}
