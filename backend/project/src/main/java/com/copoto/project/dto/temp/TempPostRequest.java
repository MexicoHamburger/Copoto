package com.copoto.project.dto.temp;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "임시 게시글 저장 요청 DTO")
public class TempPostRequest {
    @Schema(description = "게시글 제목", example = "임시 저장 제목")
    private String title;
    @Schema(description = "게시글 내용", example = "임시 저장 내용")
    private String contents;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContents() { return contents; }
    public void setContents(String contents) { this.contents = contents; }
}
