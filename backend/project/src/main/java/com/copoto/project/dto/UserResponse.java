package com.copoto.project.dto;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "회원 응답 DTO")
public class UserResponse {

    @Schema(description = "사용자 ID", example = "user1")
    private String id;

    @Schema(description = "닉네임", example = "SKKUniv쓲빢", required = true)
    private String nickname;

    @Schema(description = "생성 일시", example = "2025-01-01T13:11:23.703Z")
    private LocalDateTime createdAt;

    // Getter and Setter
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getNickname(){
        return nickname;
    }
    public void setNickname(String nickname){
        this.nickname = nickname;
    }
}
