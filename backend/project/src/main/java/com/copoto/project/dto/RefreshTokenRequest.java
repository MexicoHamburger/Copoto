package com.copoto.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public class RefreshTokenRequest {
    @Schema(description = "리프레시 토큰", example = "your_refresh_token_here")
    private String refreshToken;

    // getter, setter
    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}

