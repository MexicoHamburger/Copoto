package com.copoto.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "로그인 요청 DTO")
public class LoginRequest {

    @Schema(description = "사용자 ID", example = "user1", required = true)
    private String id;

    @Schema(description = "비밀번호", example = "password123", required = true)
    private String password;

    // Getter and Setter
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
