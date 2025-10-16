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
import com.copoto.project.dto.post.PostRequest;
import com.copoto.project.dto.post.PostResponse;
import com.copoto.project.entity.Post;
import com.copoto.project.entity.User;
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
@RequestMapping("/api/post")
@CrossOrigin(origins = "http://localhost:3000") // React의 도메인 주소
@Tag(name = "게시판 API", description = "게시글 관리 API")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private UserService userService;

    // AI 혐오 검출 API 호출 메서드
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


    @PostMapping("/create")
    @Operation(
        summary = "게시글 생성 - auth를 필요로 합니다",
        description = "게시글을 등록합니다. 혐오 발언은 등록 거부됩니다."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Post created succesfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Post created successfully",
                        "data": {
                            "postId": 11,
                            "title": "게시글 제목2",
                            "contents": "게시글 내용2",
                            "type": "notice",
                            "userId": "test4",
                            "createdAt": "2025-10-16T01:51:02.407733",
                            "updatedAt": "2025-10-16T01:51:02.407805",
                            "hateSpeech": false,
                            "viewCount": 0
                        }
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Title or Content or Type is required",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 400,
                        "message": "Contents are required",
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
                        "message": "혐오 발언이 감지되어 게시글이 등록되지 않았습니다.",
                        "data": {
                            "postId": null,
                            "title": "게시글 제목2 씨발아",
                            "contents": "게시글 내용2",
                            "type": "notice",
                            "userId": "test4",
                            "createdAt": null,
                            "updatedAt": null,
                            "hateSpeech": true,
                            "viewCount": null
                        }
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "토큰 만기 or 오류 (만기일 수도 있으니, refresh를 시도하고 나서도 이러면 재로그인으로 유도해야합니다)",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 401,
                        "message": "User not authenticated",
                        "data": null
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<PostResponse>> createPost(
        @RequestBody PostRequest request,
        Authentication authentication // Spring Security가 JWT에서 추출한 인증 객체 자동 주입
    ) {
        // 필수 값 검증
        if (request.getTitle() == null || request.getTitle().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Title is required", null));
        }
        if (request.getContents() == null || request.getContents().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Contents are required", null));
        }
        if (request.getType() == null || request.getType().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Type is required", null));
        }

        // 인증된 사용자 정보 추출
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).body(new ApiResponseCustom<>(401, "User not authenticated", null));
        }
        User user = (User) authentication.getPrincipal();

        // 혐오 발언 검출
        boolean hateTitle = isHateSpeech(request.getTitle());
        boolean hateContents = isHateSpeech(request.getContents());
        if (hateTitle || hateContents) {
            PostResponse response = new PostResponse();
            response.setTitle(request.getTitle());
            response.setContents(request.getContents());
            response.setType(request.getType());
            response.setUserId(user.getId());
            response.setHateSpeech(true);
            return ResponseEntity.status(403).body(
                new ApiResponseCustom<>(403, "혐오 발언이 감지되어 게시글이 등록되지 않았습니다.", response));
        }

        // 게시글 엔티티 생성 및 저장
        Post post = new Post();
        post.setTitle(request.getTitle());
        post.setContents(request.getContents());
        post.setType(request.getType());
        post.setView_count(0L);
        post.setUser(user);

        Post createdPost = postService.createPost(post, user);

        // 응답 DTO 생성
        PostResponse response = new PostResponse();
        response.setPostId(createdPost.getPostId());
        response.setTitle(createdPost.getTitle());
        response.setContents(createdPost.getContents());
        response.setType(createdPost.getType());
        response.setViewCount(createdPost.getView_count());
        response.setUserId(user.getId());
        response.setCreatedAt(createdPost.getCreatedAt());
        response.setUpdatedAt(createdPost.getUpdatedAt());
        response.setHateSpeech(false);

        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Post created successfully", response));
    }

    @GetMapping("/{postId}")
    @Operation(summary = "게시글 조회 - GET이므로 현재는 auth를 필요로 하지 않습니다.", description = "특정 게시글을 조회합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Post fetched successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Post fetched successfully",
                        "data": {
                            "postId": 11,
                            "title": "게시글 제목2",
                            "contents": "게시글 내용2",
                            "type": "notice",
                            "userId": "test4",
                            "createdAt": "2025-10-16T01:51:02.407733",
                            "updatedAt": "2025-10-16T02:07:21.719378",
                            "hateSpeech": null,
                            "viewCount": 2
                        }
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Post not found",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "timestamp": "2025-10-15T17:09:13.839+00:00",
                        "status": 500,
                        "error": "Internal Server Error",
                        "trace": "엄청나게 긴 오류 로그...",
                        "message": "Post not found",
                        "path": "/api/post/12"
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<PostResponse>> getPostById(@PathVariable Long postId) {
        Post post = postService.getPostById(postId);
        if (post == null) {
            return ResponseEntity.status(404).body(new ApiResponseCustom<>(404, "Post not found", null));
        }
        postService.increaseViewCount(post); // 특정 게시글 조회 API 호출 시 조회수 증가

        PostResponse response = new PostResponse();
        response.setPostId(post.getPostId());
        response.setTitle(post.getTitle());
        response.setContents(post.getContents());
        response.setType(post.getType());
        response.setViewCount(post.getView_count());
        response.setUserId(post.getUser().getId());
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());

        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Post fetched successfully", response));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "게시판 별 게시글 조회 - GET이므로 현재는 auth를 필요로 하지 않습니다.", description = "게시판 별 게시글 목록을 반환합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Posts for the given type fetched successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Posts fetched successfully",
                        "data": [
                            {
                                "postId": "1",
                                "title": "My First Post in Free Board",
                                "contents": "This is the content.",
                                "type": "free",
                                "view_count": "10",
                                "userId": "user123",
                                "createdAt": "2023-01-01T12:00:00",
                                "updatedAt": "2023-01-01T12:00:00"
                            },
                            {
                                "postId": "3",
                                "title": "My First Post in Free Board",
                                "contents": "This is the content.",
                                "type": "free",
                                "view_count": "15",
                                "userId": "user456",
                                "createdAt": "2023-01-01T12:00:00",
                                "updatedAt": "2023-01-01T12:00:00"
                            }
                        ]
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<List<PostResponse>>> getPostsByType(@PathVariable String type) {
        List<Post> posts = postService.getPostsByType(type);

        List<PostResponse> postResponses = posts.stream().map(post -> {
            PostResponse response = new PostResponse();
            response.setPostId(post.getPostId());
            response.setTitle(post.getTitle());
            response.setContents(post.getContents());
            response.setType(post.getType());
            response.setViewCount(post.getView_count());
            response.setUserId(post.getUser().getId());
            response.setCreatedAt(post.getCreatedAt());
            response.setUpdatedAt(post.getUpdatedAt());
            return response;
        }).toList();

        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Posts fetched successfully", postResponses));
    }

    @Operation(
        summary = "유저별 게시글 전체 조회",
        description = "유저 ID로 게시글 목록을 조회합니다."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "게시글 목록 반환",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = PostResponse.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "해당하는 유저 없음"
        )
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponseCustom<List<PostResponse>>> getPostsByUser(
        @Parameter(description = "유저 ID", example = "user123", required = true)
        @PathVariable("userId") String userId
    ) {
        try {
            User user = userService.getUserById(userId);
            List<Post> posts = postService.getPostsByUser(user);
            List<PostResponse> list = posts.stream().map(post -> {
                PostResponse res = new PostResponse();
                res.setPostId(post.getPostId());
                res.setTitle(post.getTitle());
                res.setContents(post.getContents());
                res.setType(post.getType());
                res.setViewCount(post.getView_count());
                res.setUserId(post.getUser().getId());
                res.setCreatedAt(post.getCreatedAt());
                res.setUpdatedAt(post.getUpdatedAt());
                return res;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(new ApiResponseCustom<>(200, "Comments fetched successfully", list));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ApiResponseCustom<>(404, e.getMessage(), null));
        }
    }

    @GetMapping("/all")
    @Operation(summary = "모든 게시글 조회 - GET이므로 현재는 auth를 필요로 하지 않습니다.", description = "모든 게시글 목록을 반환합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Posts fetched successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Posts fetched successfully",
                        "data": [
                            {
                                "postId": "1",
                                "title": "My First Post",
                                "contents": "This is the content of the first post.",
                                "type": "free",
                                "view_count": "3",
                                "userId": "user123",
                                "createdAt": "2023-01-01T12:00:00",
                                "updatedAt": "2023-01-01T12:00:00"
                            },
                            {
                                "postId": "2",
                                "title": "My Second Post",
                                "contents": "This is the content of the second post.",
                                "type": "qna",
                                "view_count": "5",
                                "userId": "user456",
                                "createdAt": "2023-01-02T12:00:00",
                                "updatedAt": "2023-01-02T12:00:00"
                            }
                        ]
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<List<PostResponse>>> getAllPosts() {
        List<PostResponse> posts = postService.getAllPosts().stream().map(post -> {
            PostResponse response = new PostResponse();
            response.setPostId(post.getPostId());
            response.setTitle(post.getTitle());
            response.setContents(post.getContents());
            response.setType(post.getType());
            response.setViewCount(post.getView_count());
            response.setUserId(post.getUser().getId());
            response.setCreatedAt(post.getCreatedAt());
            response.setUpdatedAt(post.getUpdatedAt());
            return response;
        }).toList();

        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Posts fetched successfully", posts));
    }

   @PutMapping("/{postId}")
    @Operation(summary = "게시글 수정 - auth를 필요로 합니다", description = "특정 게시글을 수정합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Post updated successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "postId": 10,
                        "title": "게시글 제목1을 수정합니다",
                        "contents": "게시글 내용1을 수정합니다",
                        "type": "notice",
                        "userId": "test4",
                        "createdAt": "2025-10-16T01:46:59.672759",
                        "updatedAt": "2025-10-16T02:23:23.243392",
                        "hateSpeech": false,
                        "viewCount": 21
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "500",
            description = "You are not allowed to edit this post. - 토큰이 잘못됐습니다 (본인의 게시글이 아님)",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "timestamp": "2025-10-15T17:28:00.917+00:00",
                        "status": 500,
                        "error": "Internal Server Error",
                        "trace": "엄청 긴 오류 로그...",
                        "message": "You are not allowed to edit this post.",
                        "path": "/api/post/10"
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "User not authenticated - 토큰이 잘못됐습니다 (토큰 만기 또는 토큰 오류)",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 401,
                        "message": "User not authenticated",
                        "data": null
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<PostResponse>> updatePost(
        @PathVariable("postId") Long postId,
        @RequestBody PostRequest request,
        Authentication authentication // 인증 객체 자동 주입
    ) {
        // 필수 값 검증
        if (request.getTitle() == null || request.getTitle().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Title is required", null));
        }
        if (request.getContents() == null || request.getContents().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Contents are required", null));
        }
        if (request.getType() == null || request.getType().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Type is required", null));
        }

        // 인증된 사용자 정보 추출
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).body(new ApiResponseCustom<>(401, "User not authenticated", null));
        }
        User user = (User) authentication.getPrincipal();

        // 혐오 발언 검출
        boolean hateTitle = isHateSpeech(request.getTitle());
        boolean hateContents = isHateSpeech(request.getContents());
        if (hateTitle || hateContents) {
            PostResponse response = new PostResponse();
            response.setTitle(request.getTitle());
            response.setContents(request.getContents());
            response.setType(request.getType());
            response.setUserId(user.getId());
            response.setHateSpeech(true);
            return ResponseEntity.status(403).body(
                new ApiResponseCustom<>(403, "혐오 발언이 감지되어 게시글이 수정되지 않았습니다.", response));
        }

        // 게시글 수정 (user 정보 활용)
        Post updatedPost = postService.updatePost(postId, request.getTitle(), request.getContents(), request.getType(), user);

        // 응답 DTO 생성
        PostResponse response = new PostResponse();
        response.setPostId(updatedPost.getPostId());
        response.setTitle(updatedPost.getTitle());
        response.setContents(updatedPost.getContents());
        response.setType(updatedPost.getType());
        response.setViewCount(updatedPost.getView_count());
        response.setUserId(user.getId());
        response.setCreatedAt(updatedPost.getCreatedAt());
        response.setUpdatedAt(updatedPost.getUpdatedAt());
        response.setHateSpeech(false);

        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Post updated successfully", response));
    }


    @DeleteMapping("/{postId}")
    @Operation(summary = "게시글 삭제 - auth를 필요로 합니다", description = "특정 게시글을 삭제합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Post deleted successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Post deleted successfully",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "403",
            description = "You are not allowed to delete this post. (넣은 토큰이 게시판 주인과 다릅니다.)",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 403,
                        "message": "You are not allowed to delete this post.",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "User not authenticated. (넣은 토큰에 문제가 있습니다.)",
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
            responseCode = "404",
            description = "Post not found. (없는 게시글을 지우려 합니다)",
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
        @ApiResponse(
            responseCode = "404",
            description = "Post not found. (없는 게시글을 지우려 합니다)",
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
    public ResponseEntity<ApiResponseCustom<Void>> deletePost(
        @PathVariable Long postId,
        Authentication authentication // 인증 객체 자동 주입
    ) {
        // 인증된 사용자 정보 추출
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).body(new ApiResponseCustom<>(401, "User not authenticated", null));
        }
        User user = (User) authentication.getPrincipal();
        
        try {
            postService.deletePost(postId, user); // 본인만 삭제 가능하도록 user 정보 전달
            return ResponseEntity.ok(new ApiResponseCustom<>(200, "Post deleted successfully", null));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(new ApiResponseCustom<>(403, "You are not allowed to delete this post.", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ApiResponseCustom<>(404, "Post not found", null));
        }
    }
}
