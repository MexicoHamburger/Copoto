package com.copoto.project.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
import com.copoto.project.dto.CommentRequest;
import com.copoto.project.dto.CommentResponse;
import com.copoto.project.entity.Comment;
import com.copoto.project.entity.Post;
import com.copoto.project.entity.User;
import com.copoto.project.service.CommentService;
import com.copoto.project.service.PostService;
import com.copoto.project.service.UserService;

@RestController
@RequestMapping("/api/comment")
@CrossOrigin(origins = "http://localhost:3000")
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

    @PostMapping("/create")
    public ResponseEntity<ApiResponseCustom<CommentResponse>> createComment(@RequestBody CommentRequest request) {
        if (request.getContent() == null || request.getContent().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Content is required", null));
        }
        User user = userService.getUserById(request.getUserId());
        if (user == null) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Invalid user ID", null));
        }
        Post post = postService.getPostById(request.getPostId());
        if (post == null) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Invalid post ID", null));
        }

        boolean hate = isHateSpeech(request.getContent());

        if (hate) {
            // 혐오 발언 감지 시에도 결과를 응답에 포함
            CommentResponse response = new CommentResponse();
            response.setContent(request.getContent());
            response.setUserId(request.getUserId());
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
        response.setUserId(created.getUser().getId());
        response.setPostId(created.getPost().getPostId());
        response.setCreatedAt(created.getCreatedAt());
        response.setHateSpeech(false); // 정상 등록 시 false

        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Comment created successfully", response));
    }

    @GetMapping("/{commentId}")
    public ResponseEntity<ApiResponseCustom<CommentResponse>> getCommentById(@PathVariable("commentId") Long commentId) {
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

    @GetMapping("/post/{postId}")
    public ResponseEntity<ApiResponseCustom<List<CommentResponse>>> getCommentsByPost(@PathVariable("postId") Long postId) {
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

    @PutMapping("/{commentId}")
    public ResponseEntity<ApiResponseCustom<CommentResponse>> updateComment(@PathVariable("commentId") Long commentId,
            @RequestBody Map<String, String> body) {
        String newContent = body.get("content");
        if (newContent == null || newContent.isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Content is required", null));
        }

        if (isHateSpeech(newContent)) {
            return ResponseEntity.status(403).body(
                new ApiResponseCustom<>(403, "혐오 발언이 감지되어 댓글이 수정되지 않았습니다.", null));
        }

        try {
            Comment updated = commentService.updateComment(commentId, newContent);
            CommentResponse response = new CommentResponse();
            response.setCommentId(updated.getId());
            response.setContent(updated.getContent());
            response.setUserId(updated.getUser().getId());
            response.setPostId(updated.getPost().getPostId());
            response.setCreatedAt(updated.getCreatedAt());

            return ResponseEntity.ok(new ApiResponseCustom<>(200, "Comment updated successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ApiResponseCustom<>(404, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponseCustom<Void>> deleteComment(@PathVariable Long commentId) {
        try {
            commentService.deleteComment(commentId);
            return ResponseEntity.ok(new ApiResponseCustom<>(200, "Comment deleted successfully", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ApiResponseCustom<>(404, e.getMessage(), null));
        }
    }
}
