package com.copoto.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "유저 게시글/댓글 숨김 요청 DTO")
public class UpdateHideRequest {
    @Schema(description = "요청한 숨김 상태", example = "true", required = true)
    private Boolean hide;

    // Getter and Setter
    public Boolean getHide() {
        return hide;
    }

    public void setHide(Boolean hide) {
        this.hide = hide;
    }
}
