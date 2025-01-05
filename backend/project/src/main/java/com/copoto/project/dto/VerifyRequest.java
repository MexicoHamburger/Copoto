package com.copoto.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "유저 검증 DTO")
public class VerifyRequest {

    @Schema(description = "사용자 ID", example = "user1", required = true)
    private String id;

    // Getter and Setter
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

}
