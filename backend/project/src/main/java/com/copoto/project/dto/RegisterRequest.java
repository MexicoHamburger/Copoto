package com.copoto.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "회원 가입 요청 DTO")
public class RegisterRequest {

    @Schema(description = "사용자 ID", example = "user1", required = true)
    private String id;

    @Schema(description = "비밀번호", example = "password123", required = true)
    private String password;

    @Schema(description = "닉네임", example = "SKKUniv쓲빢빢", required = true)
    private String nickname;

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

    public String getNickname(){
        return nickname;
    }

    public void setNickname(String nickname){
        this.nickname=nickname;
    }
}
