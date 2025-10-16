package com.copoto.project.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.copoto.project.dto.ApiResponseCustom;
import com.copoto.project.dto.CommentRequest;
import com.copoto.project.dto.CommentResponse;
import com.copoto.project.entity.Comment;
import com.copoto.project.entity.Post;
import com.copoto.project.entity.User;
import com.copoto.project.service.CommentService;
import com.copoto.project.service.PostService;
import com.copoto.project.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/comment")
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "댓글 API", description = "게시글 댓글 등록/조회/수정/삭제 및 혐오 발언 검출")
public class CommentController {

    @Autowired
    private CommentService commentService;
    @Autowired
    private UserService userService;
    @Autowired
    private PostService postService;

    private boolean isHateSpeech(String text) {
        String flaskApiUrl = "http://127.0.0.1:5000/predict";
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String payload = "{\"text\":\"" + text + "\"}";
        HttpEntity<String> entity = new HttpEntity<>(payload, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(flaskApiUrl, entity, Map.class);
            Map<String, Object> result = response.getBody();
            Integer isHate = result != null ? (Integer) result.get("is_hate") : null;
            return isHate != null && isHate == 1;
        } catch (Exception e) {
            return false;
        }
    }


    @Operation(
        summary = "댓글 생성-auth를 필요로 합니다.",
        description = "게시글에 댓글을 등록합니다. 혐오 발언은 등록 거부됩니다."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "성공 - Comment created succesfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Comment created successfully",
                        "data": {
                            "commentId": 14,
                            "content": "정상적인 댓글",
                            "userId": "sc9337",
                            "postId": 16,
                            "createdAt": "2025-10-16T14:33:42.170649",
                            "hateSpeech": false
                        }
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Request Body '형식'에 문제가 있어요 - Content is required",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 400,
                        "message": "Content is required",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "500",
            description = "없는 게시글이에요 - Post not found",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "timestamp": "2025-10-16T05:40:00.201+00:00",
                        "status": 500,
                        "error": "Internal Server Error",
                        "trace": "대충 겁나 긴 에러 로그...",
                        "message": "Post not found",
                        "path": "/api/comment/create"
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "토큰 관련 문제가 있어요 - User not authenticated",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 401,
                        "message": "User not authenticated",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "403",
            description = "혐오표현 탐지",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 403,
                        "message": "혐오 발언이 감지되어 댓글이 등록되지 않았습니다.",
                        "data": {
                            "commentId": null,
                            "content": "비정상 댓글 - 개호로잡새끼",
                            "userId": "sc9337",
                            "postId": 16,
                            "createdAt": null,
                            "hateSpeech": true
                        }
                    }
                """)
            )
        )
    })
    @PostMapping("/create")
    public ResponseEntity<ApiResponseCustom<CommentResponse>> createComment(
        @RequestBody CommentRequest request,
        Authentication authentication // 인증 객체 자동 주입
    ) {
        if (request.getContent() == null || request.getContent().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Content is required", null));
        }
        if (request.getPostId() == null) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Post ID is required", null));
        }
        // 인증된 사용자 정보 추출
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).body(new ApiResponseCustom<>(401, "User not authenticated", null));
        }
        User user = (User) authentication.getPrincipal();
        Post post = postService.getPostById(request.getPostId());
        if (post == null) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Invalid post ID", null));
        }
        boolean hate = isHateSpeech(request.getContent());
        if (hate) {
            CommentResponse response = new CommentResponse();
            response.setContent(request.getContent());
            response.setUserId(user.getId());
            response.setPostId(request.getPostId());
            response.setHateSpeech(true);
            return ResponseEntity.status(403).body(
                new ApiResponseCustom<>(403, "혐오 발언이 감지되어 댓글이 등록되지 않았습니다.", response));
        }
        Comment comment = new Comment();
        comment.setContent(request.getContent());
        comment.setUser(user);
        comment.setPost(post);
        Comment created = commentService.createComment(comment, post, user);
        CommentResponse response = new CommentResponse();
        response.setCommentId(created.getId());
        response.setContent(created.getContent());
        response.setUserId(user.getId());
        response.setPostId(post.getPostId());
        response.setCreatedAt(created.getCreatedAt());
        response.setHateSpeech(false);
        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Comment created successfully", response));
    }


    @Operation(
        summary = "댓글 단건 조회 - 현재 모든 GET은 auth를 필요로 하지 않습니다.",
        description = "댓글 ID로 댓글을 조회합니다."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "성공 - Comment fetched successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Comment fetched successfully",
                        "data": {
                            "commentId": 15,
                            "content": "정상적인 댓글",
                            "userId": "sc9337",
                            "postId": 16,
                            "createdAt": "2025-10-16T14:36:22.144961",
                            "hateSpeech": null
                        }
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "없는 댓글이에요 - Comment not found",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 404,
                        "message": "Comment fetched successfully",
                        "data": {
                            "status": 404,
                            "message": "Comment not found",
                            "data": null
                        }
                    }
                """)
            )
        )
    })
    @GetMapping("/{commentId}")
    public ResponseEntity<ApiResponseCustom<CommentResponse>> getCommentById(
        @Parameter(description = "댓글 ID", example = "1", required = true)
        @PathVariable("commentId") Long commentId
    ) {
        try {
            Comment comment = commentService.getCommentById(commentId);
            CommentResponse response = new CommentResponse();
            response.setCommentId(comment.getId());
            response.setContent(comment.getContent());
            response.setUserId(comment.getUser().getId());
            response.setPostId(comment.getPost().getPostId());
            response.setCreatedAt(comment.getCreatedAt());
            return ResponseEntity.ok(new ApiResponseCustom<>(200, "Comment fetched successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ApiResponseCustom<>(404, e.getMessage(), null));
        }
    }


    @Operation(
        summary = "게시글별 댓글 전체 조회 - 현재 모든 GET은 auth를 필요로 하지 않습니다.",
        description = "게시글 ID로 댓글 목록을 조회합니다."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "성공 - Comments fetched successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Comments fetched successfully",
                        "data": [
                            {
                                "commentId": 14,
                                "content": "정상적인 댓글",
                                "userId": "sc9337",
                                "postId": 16,
                                "createdAt": "2025-10-16T14:33:42.170649",
                                "hateSpeech": null
                            },
                            {
                                "commentId": 15,
                                "content": "정상적인 댓글2",
                                "userId": "sc9337",
                                "postId": 16,
                                "createdAt": "2025-10-16T14:36:22.144961",
                                "hateSpeech": null
                            },
                            {
                                "commentId": 16,
                                "content": "정상적인 댓글3",
                                "userId": "sc9337",
                                "postId": 16,
                                "createdAt": "2025-10-16T14:36:26.479487",
                                "hateSpeech": null
                            }
                        ]
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "없는 게시글의 댓글을 불러올 수는 없어요 - Post not found",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 404,
                        "message": "Post not found",
                        "data": null
                    }
                """)
            )
        )
    })
    @GetMapping("/post/{postId}")
    public ResponseEntity<ApiResponseCustom<List<CommentResponse>>> getCommentsByPost(
        @Parameter(description = "게시글 ID", example = "1", required = true)
        @PathVariable("postId") Long postId
    ) {
        try {
            Post post = postService.getPostById(postId);
            List<Comment> comments = commentService.getCommentsByPost(post);
            List<CommentResponse> list = comments.stream().map(comment -> {
                CommentResponse res = new CommentResponse();
                res.setCommentId(comment.getId());
                res.setContent(comment.getContent());
                res.setUserId(comment.getUser().getId());
                res.setPostId(comment.getPost().getPostId());
                res.setCreatedAt(comment.getCreatedAt());
                return res;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(new ApiResponseCustom<>(200, "Comments fetched successfully", list));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ApiResponseCustom<>(404, e.getMessage(), null));
        }
    }


    @Operation(
        summary = "유저별 댓글 전체 조회 - 현재 모든 GET은 auth를 필요로 하지 않습니다.",
        description = "유저 ID로 댓글 목록을 조회합니다."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "해당 유저의 모든 댓글을 가져왔어요 - Comments fetched successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Comments fetched successfully",
                        "data": [
                            {
                                "commentId": 2,
                                "content": "와 대박!",
                                "userId": "test1",
                                "postId": 1,
                                "createdAt": "2025-10-13T23:19:45.140889",
                                "hateSpeech": null
                            },
                            {
                                "commentId": 3,
                                "content": "댓글을 이쁘게 수정해보아요",
                                "userId": "test1",
                                "postId": 1,
                                "createdAt": "2025-10-13T23:19:52.356241",
                                "hateSpeech": null
                            }
                        ]
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "없는 유저의 댓글을 불러올 수는 없어요 - User not found",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 404,
                        "message": "User not found with ID: test",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "없는 게시글의 댓글을 불러올 수는 없어요 - Post not found",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 404,
                        "message": "Post not found",
                        "data": null
                    }
                """)
            )
        ),
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponseCustom<List<CommentResponse>>> getCommentsByUser(
        @Parameter(description = "유저 ID", example = "user123", required = true)
        @PathVariable("userId") String userId
    ) {
        try {
            User user = userService.getUserById(userId);
            List<Comment> comments = commentService.getCommentsByUser(user);
            List<CommentResponse> list = comments.stream().map(comment -> {
                CommentResponse res = new CommentResponse();
                res.setCommentId(comment.getId());
                res.setContent(comment.getContent());
                res.setUserId(comment.getUser().getId());
                res.setPostId(comment.getPost().getPostId());
                res.setCreatedAt(comment.getCreatedAt());
                return res;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(new ApiResponseCustom<>(200, "Comments fetched successfully", list));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ApiResponseCustom<>(404, e.getMessage(), null));
        }
    }


    @Operation(
        summary = "댓글 수정 - auth를 필요로 합니다",
        description = "댓글 내용을 수정합니다. 혐오 발언이 감지되면 거부됩니다."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "댓글 수정에 성공 - Comment updated successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Comment updated successfully",
                        "data": {
                            "commentId": 16,
                            "content": "정상 댓글 수정이욤",
                            "userId": "sc9337",
                            "postId": 16,
                            "createdAt": "2025-10-16T14:36:26.479487",
                            "hateSpeech": null
                        }
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "토큰에 문제가 있어요 - User not authenticated",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 401,
                        "message": "User not authenticated",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Request Body가 이상해요! - Content is required",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 400,
                        "message": "Content is required",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "403",
            description = "남의 댓글은 수정할 수 없어요 - You are not allowed to edit this comment.",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 403,
                        "message": "You are not allowed to edit this comment.",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "없는 댓글을 수정할 수 없어요 - Comment not found",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 404,
                        "message": "Comment not found",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "405",
            description = "수정한 댓글에 혐오표현 적발",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 405,
                        "message": "혐오 발언이 감지되어 댓글이 수정되지 않았습니다.",
                        "data": null
                    }
                """)
            )
        )
    })
    @PutMapping("/{commentId}")
    public ResponseEntity<ApiResponseCustom<CommentResponse>> updateComment(
        @Parameter(description = "댓글 ID", example = "1", required = true)
        @PathVariable("commentId") Long commentId,
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "수정할 내용(JSON: {\"content\": \"...\"})", required = true,
            content = @Content(schema = @Schema(
                example = "{\"content\":\"수정할 댓글 내용\"}"
            ))
        )
        @RequestBody Map<String, String> body,
        Authentication authentication // 인증 객체 자동 주입
    ) {
        String newContent = body.get("content");
        if (newContent == null || newContent.isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Content is required", null));
        }

        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).body(new ApiResponseCustom<>(401, "User not authenticated", null));
        }
        User user = (User) authentication.getPrincipal();

        if (isHateSpeech(newContent)) {
            return ResponseEntity.status(405).body(
                new ApiResponseCustom<>(405, "혐오 발언이 감지되어 댓글이 수정되지 않았습니다.", null));
        }

        try {
            Comment updated = commentService.updateComment(commentId, newContent, user); // user 전달
            CommentResponse response = new CommentResponse();
            response.setCommentId(updated.getId());
            response.setContent(updated.getContent());
            response.setUserId(updated.getUser().getId());
            response.setPostId(updated.getPost().getPostId());
            response.setCreatedAt(updated.getCreatedAt());

            return ResponseEntity.ok(new ApiResponseCustom<>(200, "Comment updated successfully", response));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(new ApiResponseCustom<>(403, "You are not allowed to edit this comment.", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ApiResponseCustom<>(404, e.getMessage(), null));
        }
    }




    @Operation(
        summary = "댓글 삭제 - auth를 필요로 합니다",
        description = "댓글 ID로 댓글을 삭제합니다."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "정상적으로 삭제하였어요 - Comment deleted successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Comment deleted successfully",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "토큰에 문제가 있어요 - User not authenticated",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 401,
                        "message": "User not authenticated",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "403",
            description = "남의 댓글을 지울 수 없어요 - You are not allowed to delete this comment.",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 403,
                        "message": "You are not allowed to delete this comment.",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "없는 댓글 지울 수 없음 - Comment not found",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 404,
                        "message": "Comment not found",
                        "data": null
                    }
                """)
            )
        )
    })
    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponseCustom<Void>> deleteComment(
        @Parameter(description = "댓글 ID", example = "1", required = true)
        @PathVariable Long commentId,
        Authentication authentication // 인증 객체 자동 주입
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).body(new ApiResponseCustom<>(401, "User not authenticated", null));
        }
        User user = (User) authentication.getPrincipal();

        try {
            commentService.deleteComment(commentId, user); // 본인만 삭제 가능하도록 user 정보 전달
            return ResponseEntity.ok(new ApiResponseCustom<>(200, "Comment deleted successfully", null));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(new ApiResponseCustom<>(403, "You are not allowed to delete this comment.", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ApiResponseCustom<>(404, e.getMessage(), null));
        }
    }
}
