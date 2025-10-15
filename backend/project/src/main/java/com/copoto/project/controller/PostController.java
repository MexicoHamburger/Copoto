package com.copoto.project.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/post")
@CrossOrigin(origins = "http://localhost:3000") // React의 도메인 주소
@Tag(name = "Post API", description = "게시글 관리 API")
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
    @Operation(summary = "게시글 작성", description = "새로운 게시글을 작성합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Post created successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Post created successfully",
                        "data": {
                            "postId": "1",
                            "title": "My First Post",
                            "contents": "This is the content of the first post.",
                            "type": "free",
                            "view_count": "0",
                            "userId": "user123",
                            "createdAt": "2023-01-01T12:00:00",
                            "updatedAt": "2023-01-01T12:00:00"
                        }
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Missing required fields",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 400,
                        "message": "Title, contents and type are required",
                        "data": null
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<PostResponse>> createPost(@RequestBody PostRequest request) {
        if (request.getTitle() == null || request.getTitle().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Title is required", null));
        }
        if (request.getContents() == null || request.getContents().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Contents are required", null));
        }
        if (request.getType() == null || request.getType().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Type are required", null));
        }

        // AI 혐오 API에 본문 검증 요청
        // 제목과 내용 모두 검수
        boolean hateTitle = isHateSpeech(request.getTitle());
        boolean hateContents = isHateSpeech(request.getContents());

        if (hateTitle || hateContents) {
            PostResponse response = new PostResponse();
            response.setTitle(request.getTitle());
            response.setContents(request.getContents());
            response.setType(request.getType());
            response.setUserId(request.getUserId());
            response.setHateSpeech(hateTitle || hateContents);
            return ResponseEntity.status(403).body(
                new ApiResponseCustom<>(403, "혐오 발언이 감지되어 게시글이 등록되지 않았습니다.", response));
        }

        User user = userService.getUserById(request.getUserId());
        if (user == null) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Invalid user ID", null));
        }

        Post post = new Post();
        post.setTitle(request.getTitle());
        post.setContents(request.getContents());
        post.setType(request.getType());
        post.setView_count(0L);
        post.setUser(user);

        Post createdPost = postService.createPost(post, user);

        PostResponse response = new PostResponse();
        response.setPostId(createdPost.getPostId());
        response.setTitle(createdPost.getTitle());
        response.setContents(createdPost.getContents());
        response.setType(createdPost.getType());
        response.setViewCount(createdPost.getView_count());
        response.setUserId(createdPost.getUser().getId());
        response.setCreatedAt(createdPost.getCreatedAt());
        response.setUpdatedAt(createdPost.getUpdatedAt());
        response.setHateSpeech(false); // 정상 등록 시 false

        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Post created successfully", response));
    }

    @GetMapping("/{postId}")
    @Operation(summary = "게시글 조회", description = "특정 게시글을 조회합니다.")
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
                            "postId": "1",
                            "title": "My First Post",
                            "contents": "This is the content of the first post.",
                            "type": "free",
                            "view_count": "3",
                            "userId": "user123",
                            "createdAt": "2023-01-01T12:00:00",
                            "updatedAt": "2023-01-01T12:00:00"
                        }
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Post not found",
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
    public ResponseEntity<ApiResponseCustom<PostResponse>> getPostById(@PathVariable Long postId) {
        Post post = postService.getPostById(postId);
        if (post == null) {
            return ResponseEntity.status(404).body(new ApiResponseCustom<>(404, "Post not found", null));
        }

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
    @Operation(summary = "게시판 별 게시글 조회", description = "게시판 별 게시글 목록을 반환합니다.")
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


    @GetMapping("/all")
    @Operation(summary = "모든 게시글 조회", description = "모든 게시글 목록을 반환합니다.")
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
    @Operation(summary = "게시글 수정", description = "특정 게시글을 수정합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Post updated successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Post updated successfully",
                        "data": {
                            "postId": "1",
                            "title": "Updated Post",
                            "contents": "Updated content of the post.",
                            "type": "qna",
                            "view_count": "3",
                            "userId": "user123",
                            "createdAt": "2023-01-01T12:00:00",
                            "updatedAt": "2023-01-02T12:00:00",
                            "hateSpeech": false
                        }
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<PostResponse>> updatePost(
        @PathVariable("postId") Long postId,
        @RequestBody PostRequest request) {

        // 제목/내용 모두 검수
        boolean hateTitle = isHateSpeech(request.getTitle());
        boolean hateContents = isHateSpeech(request.getContents());

        if (hateTitle || hateContents) {
            PostResponse response = new PostResponse();
            response.setTitle(request.getTitle());
            response.setContents(request.getContents());
            response.setUserId(null); // 필요시 userId 세팅
            response.setType(request.getType());
            response.setHateSpeech(true);
            return ResponseEntity.status(403).body(
                new ApiResponseCustom<>(403, "혐오 발언이 감지되어 게시글이 수정되지 않았습니다.", response));
        }

        Post updatedPost = postService.updatePost(postId, request.getTitle(), request.getContents(), request.getType());

        PostResponse response = new PostResponse();
        response.setPostId(updatedPost.getPostId());
        response.setTitle(updatedPost.getTitle());
        response.setContents(updatedPost.getContents());
        response.setType(updatedPost.getType());
        response.setViewCount(updatedPost.getView_count());
        response.setUserId(updatedPost.getUser().getId());
        response.setCreatedAt(updatedPost.getCreatedAt());
        response.setUpdatedAt(updatedPost.getUpdatedAt());
        response.setHateSpeech(false);

        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Post updated successfully", response));
    }


    @DeleteMapping("/{postId}")
    @Operation(summary = "게시글 삭제", description = "특정 게시글을 삭제합니다.")
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
        )
    })
    public ResponseEntity<ApiResponseCustom<Void>> deletePost(@PathVariable Long postId) {
        postService.deletePost(postId);
        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Post deleted successfully", null));
    }
}
