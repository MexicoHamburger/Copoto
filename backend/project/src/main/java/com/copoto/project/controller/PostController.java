package com.copoto.project.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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
                        "message": "Title and contents are required",
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

        User user = userService.getUserById(request.getUserId());
        if (user == null) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Invalid user ID", null));
        }

        Post post = new Post();
        post.setTitle(request.getTitle());
        post.setContents(request.getContents());
        post.setUser(user);

        Post createdPost = postService.createPost(post, user);

        PostResponse response = new PostResponse();
        response.setPostId(createdPost.getPostId());
        response.setTitle(createdPost.getTitle());
        response.setContents(createdPost.getContents());
        response.setUserId(createdPost.getUser().getId());
        response.setCreatedAt(createdPost.getCreatedAt());
        response.setUpdatedAt(createdPost.getUpdatedAt());

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
        response.setUserId(post.getUser().getId());
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());

        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Post fetched successfully", response));
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
                                "userId": "user123",
                                "createdAt": "2023-01-01T12:00:00",
                                "updatedAt": "2023-01-01T12:00:00"
                            },
                            {
                                "postId": "2",
                                "title": "My Second Post",
                                "contents": "This is the content of the second post.",
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
                            "userId": "user123",
                            "createdAt": "2023-01-01T12:00:00",
                            "updatedAt": "2023-01-02T12:00:00"
                        }
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<PostResponse>> updatePost(@PathVariable Long postId, @RequestBody String newContents) {
        Post updatedPost = postService.updatePost(postId, newContents);

        PostResponse response = new PostResponse();
        response.setPostId(updatedPost.getPostId());
        response.setTitle(updatedPost.getTitle());
        response.setContents(updatedPost.getContents());
        response.setUserId(updatedPost.getUser().getId());
        response.setCreatedAt(updatedPost.getCreatedAt());
        response.setUpdatedAt(updatedPost.getUpdatedAt());

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
