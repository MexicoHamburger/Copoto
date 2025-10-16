package com.copoto.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "유저 닉네임 중복여부 확인 DTO")
public class UpdatePasswordRequest {
    @Schema(description = "현재 비밀번호", example = "oldpassword", required = true)
    private String oldPassword;
    @Schema(description = "변경하려는 비밀번호", example = "newpassword", required = true)
    private String newPassword;

    // Getter and Setter
    public String getOldPassword() {
        return oldPassword;
    }

    public void setOldPassword(String oldPassword) {
        this.oldPassword = oldPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
