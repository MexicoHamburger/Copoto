package com.copoto.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "유저 닉네임 중복여부 확인 DTO")
public class VerifyNicknameRequest {

    @Schema(description = "사용자 Nickname", example = "SKKUniv쓲빢", required = true)
    private String nickname;

    // Getter and Setter
    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

}
