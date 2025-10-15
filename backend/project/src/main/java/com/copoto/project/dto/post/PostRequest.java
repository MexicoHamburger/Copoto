package com.copoto.project.dto.post;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "게시글 요청 DTO")
public class PostRequest {

    @Schema(description = "게시글 제목", example = "My First Post", required = true)
    private String title;

    @Schema(description = "게시글 내용", example = "This is the content of the post.", required = true)
    private String contents;

    //토큰기반으로 변경되면서 제외
    // @Schema(description = "작성자 ID", example = "user1", required = true)
    // private String userId;

    @Schema(description = "게시판 구분", example = "free", required = true)
    private String type;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContents() {
        return contents;
    }

    public void setContents(String contents) {
        this.contents = contents;
    }

    // public String getUserId() {
    //     return userId;
    // }

    // public void setUserId(String userId) {
    //     this.userId = userId;
    // }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
