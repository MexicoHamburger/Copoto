package com.copoto.project.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.copoto.project.dto.ApiResponseCustom;
import com.copoto.project.dto.CommentResponse;
import com.copoto.project.dto.LoginRequest;
import com.copoto.project.dto.RefreshTokenRequest;
import com.copoto.project.dto.RegisterRequest;
import com.copoto.project.dto.UserProfileResponse;
import com.copoto.project.dto.UserResponse;
import com.copoto.project.dto.VerifyIDRequest;
import com.copoto.project.dto.VerifyNicknameRequest;
import com.copoto.project.dto.post.PostResponse;
import com.copoto.project.entity.Comment;
import com.copoto.project.entity.Post;
import com.copoto.project.entity.RefreshToken;
import com.copoto.project.entity.User;
import com.copoto.project.repository.RefreshTokenRepository;
import com.copoto.project.repository.UserRepository;
import com.copoto.project.security.JwtTokenProvider;
import com.copoto.project.service.CommentService;
import com.copoto.project.service.PostService;
import com.copoto.project.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:3000") // React의 도메인 주소
@Tag(name = "유저 API", description = "회원 관리 API")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private PostService postService;
    
    @Autowired
    private CommentService commentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;


    // AI 혐오 검출 API 호출 메서드 (PostController의 isHateSpeech와 동일)
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
            // API 호출 실패 시 일단 혐오발언 아님으로 처리하거나 적절히 처리
            return false;
        }
    }

    @PostMapping("/register")
    @Operation(summary = "회원 가입 - auth를 필요로하지 않습니다.", description = "새로운 회원을 등록합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "정상적으로 회원가입 성공 - User registered successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "User registered successfully",
                        "data": {
                            "id": "test10",
                            "nickname": "테스트10",
                            "createdAt": "2025-10-16T19:40:01.488466"
                        }
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "RequestBody에서 뭔가 부족합니다 - User ID or Password or something is missing",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 400,
                        "message": "Password is required",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "409",
            description = "중복된 ID입니다 - User ID is already in used",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 409,
                        "message": "User ID is already in used",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "403",
            description = "닉네임 혐오표현 존재",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 403,
                        "message": "닉네임에 혐오 발언이 포함되어 있어 회원가입이 거부되었습니다.",
                        "data": {
                            "id": "badㅇ112ㅇNick",
                            "nickname": "개병신호로새끼",
                            "createdAt": null
                        }
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<UserResponse>> register(@RequestBody RegisterRequest request) {
        if (request.getId() == null || request.getId().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "User ID is required", null));
        }
        if (request.getPassword() == null || request.getPassword().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Password is required", null));
        }
        if (request.getNickname() == null || request.getNickname().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Nickname is required", null));
        }

        // 닉네임 혐오발언 검출
        if (isHateSpeech(request.getNickname())) {
            UserResponse response = new UserResponse();
            response.setId(request.getId());
            response.setNickname(request.getNickname());
            return ResponseEntity.status(403).body(
                new ApiResponseCustom<>(403, "닉네임에 혐오 발언이 포함되어 있어 회원가입이 거부되었습니다.", response));
        }

        try {
            User user = new User();
            user.setId(request.getId());
            user.setPassword(request.getPassword()); // 비밀번호 암호화는 서비스에서 처리
            user.setNickname(request.getNickname());
            User registeredUser = userService.register(user);

            UserResponse response = new UserResponse();
            response.setId(registeredUser.getId());
            response.setNickname(registeredUser.getNickname());
            response.setCreatedAt(registeredUser.getCreatedAt());

            return ResponseEntity.ok(new ApiResponseCustom<>(200, "User registered successfully", response));
        } catch (IllegalArgumentException e) {
            // userService.register(user) 내부에서 ID 중복 시 IllegalArgumentException 예상
            return ResponseEntity.status(409).body(new ApiResponseCustom<>(409, "User ID is already in use", null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponseCustom<>(500, "An unexpected error occurred", null));
        }
    }

    @PostMapping("/login")
    @Operation(summary = "로그인 - auth를 필요로하지 않습니다.", description = "회원 로그인 기능을 제공합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "로그인 성공 - Login successful",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Login successful",
                        "data": {
                            "accessToken": "token1",
                            "refreshToken": "token2"
                        }
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "RequestBody에 뭔가 부족합니다 - User ID or Password is missing",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 400,
                        "message": "User ID is required",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "아이디 또는 비밀번호가 틀렸습니다 - Invalid credentials",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 401,
                        "message": "Invalid credentials",
                        "data": null
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<Map<String, String>>> login(@RequestBody LoginRequest loginRequest) {
        if (loginRequest.getId() == null || loginRequest.getId().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "User ID is required", null));
        }
        if (loginRequest.getPassword() == null || loginRequest.getPassword().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Password is required", null));
        }
        try {
            User user = userService.login(loginRequest.getId(), loginRequest.getPassword());
            if (user == null) {
                return ResponseEntity.status(401).body(new ApiResponseCustom<>(401, "Invalid credentials", null));
            }
            String accessToken = jwtTokenProvider.generateToken(user.getId());
            RefreshToken refreshToken = userService.createRefreshToken(user);

            Map<String, String> tokens = new HashMap<>();
            tokens.put("accessToken", accessToken);
            tokens.put("refreshToken", refreshToken.getToken());

            return ResponseEntity.ok(new ApiResponseCustom<>(200, "Login successful", tokens));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponseCustom<>(500, "Login failed due to server error", null));
        }
    }

    // *** Refresh Token으로 Access Token 재발급 ***
    @PostMapping("/token/refresh")
    @Operation(summary = "토큰 리프레쉬 - auth를 필요로하지 않습니다.", description = "새롭게 access Token을 발급받습니다")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "재발급 성공 - Token refreshed",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Token refreshed",
                        "data": {
                            "accessToken": "NEW_ACCESS_TOKEN",
                            "refreshToken": "SAME_REFRESH_TOKEN"
                        }
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "RefreshToken 오기입 또는 RequestBody 내용 부족' - Refresh token not found.",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 401,
                        "message": "Refresh token not found.",
                        "data": {}
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "403",
            description = "RefreshToken 만료 - Refresh token expired.",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 403,
                        "message": "Refresh token expired. Please login again.",
                        "data": null
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<Map<String, String>>> refreshToken(@RequestBody @Valid RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        Optional<RefreshToken> optionalToken = userService.findByToken(requestRefreshToken);

        // Optional에서 값 꺼내 ResponseEntity로 변환
        if (optionalToken.isPresent()) {
            RefreshToken refreshToken = optionalToken.get();
            if (userService.isRefreshTokenExpired(refreshToken)) {
                userService.deleteRefreshToken(refreshToken.getUser());
                Map<String, String> emptyMap = new HashMap<>();
                return ResponseEntity.status(403).body(new ApiResponseCustom<>(403, "Refresh token expired. Please login again.", emptyMap));
            }

            String newAccessToken = jwtTokenProvider.generateToken(refreshToken.getUser().getId());
            Map<String, String> tokenMap = new HashMap<>();
            tokenMap.put("accessToken", newAccessToken);
            tokenMap.put("refreshToken", requestRefreshToken);
            return ResponseEntity.ok(new ApiResponseCustom<>(200, "Token refreshed", tokenMap));
        } else {
            Map<String, String> emptyMap = new HashMap<>();
            return ResponseEntity.status(401).body(new ApiResponseCustom<>(401, "Refresh token not found.", emptyMap));
        }
    }




    @PostMapping("/logout")
    @Operation(summary = "로그아웃 - auth를 필요로합니다.", description = "현재 세션을 없애 로그아웃 기능을 제공합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "로그아웃 성공 - Logout successful",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Logout successful",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "토큰이 이상합니다 (안보냈거나, 오기입)- User not authenticated",
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
            description = "유효한 access token이지만 이미 로그아웃했습니다 - already no session",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 400,
                        "message": "already no session",
                        "data": null
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<String>> logout(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(new ApiResponseCustom<>(401, "User not authenticated", null));
        }
        User user = (User) authentication.getPrincipal();
        boolean existed = refreshTokenRepository.findByUser(user).isPresent();
        userService.deleteRefreshToken(user);
        if (!existed) {
            return ResponseEntity.ok(new ApiResponseCustom<>(400, "No active session found", null));
        }
        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Logout successful", null));
    }

    //이제 프로필 검색 개선해야함

    @GetMapping("/profile/{id}")
    @Operation(summary = "개인 프로필 - auth를 필요로 하지 않습니다", description = "검색한 유저의 프로필을 가져옵니다")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "해당 유저의 정보를 가져옵니다 - User profile found",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                        {
                            "status": 200,
                            "message": "User profile fetched successfully",
                            "data": {
                                "id": "showmethemoney",
                                "nickname": "쇼미더머니",
                                "createdAt": "2025-10-16T20:49:42.924343",
                                "posts": [
                                    {
                                        "postId": 22,
                                        "title": "ddd",
                                        "contents": "ddddd",
                                        "type": "notice",
                                        "userId": "showmethemoney",
                                        "createdAt": "2025-10-16T20:51:34.763332",
                                        "updatedAt": "2025-10-16T21:07:31.458837",
                                        "hateSpeech": null,
                                        "viewCount": 2
                                    },
                                    {
                                        "postId": 23,
                                        "title": "쇼미 자유게시판",
                                        "contents": "쇼미 자유게시판",
                                        "type": "free",
                                        "userId": "showmethemoney",
                                        "createdAt": "2025-10-16T21:07:52.468643",
                                        "updatedAt": "2025-10-16T21:07:52.468643",
                                        "hateSpeech": null,
                                        "viewCount": 0
                                    },
                                    {
                                        "postId": 24,
                                        "title": "쇼미 QA",
                                        "contents": "tyal QA",
                                        "type": "qna",
                                        "userId": "showmethemoney",
                                        "createdAt": "2025-10-16T21:08:02.622237",
                                        "updatedAt": "2025-10-16T21:08:02.622237",
                                        "hateSpeech": null,
                                        "viewCount": 0
                                    }
                                ],
                                "comments": [
                                    {
                                        "commentId": 19,
                                        "content": "zzz",
                                        "userId": "showmethemoney",
                                        "postId": 21,
                                        "createdAt": "2025-10-16T21:08:08.322507",
                                        "hateSpeech": null
                                    },
                                    {
                                        "commentId": 20,
                                        "content": "zzzzzzz",
                                        "userId": "showmethemoney",
                                        "postId": 16,
                                        "createdAt": "2025-10-16T21:08:19.367449",
                                        "hateSpeech": null
                                    },
                                    {
                                        "commentId": 21,
                                        "content": "123123",
                                        "userId": "showmethemoney",
                                        "postId": 17,
                                        "createdAt": "2025-10-16T21:08:31.192515",
                                        "hateSpeech": null
                                    }
                                ]
                            }
                        }
                    """)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "찾을 수 없는 유저 - User not found",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 404,
                        "message": "User not found with ID: showmethemone",
                        "data": null
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<UserProfileResponse>> getUserProfile(
        @Parameter(description = "User ID", example = "user123", required = true)
        @PathVariable("id") String id
    ) {
        try {
            // Fetch user entity
            User user = userService.getUserById(id);

            // Fetch all posts by user
            List<Post> posts = postService.getPostsByUser(user);
            List<PostResponse> postResponses = posts.stream().map(post -> {
                PostResponse postRes = new PostResponse();
                postRes.setPostId(post.getPostId());
                postRes.setTitle(post.getTitle());
                postRes.setContents(post.getContents());
                postRes.setType(post.getType());
                postRes.setUserId(post.getUser().getId());
                postRes.setViewCount(post.getView_count());
                postRes.setCreatedAt(post.getCreatedAt());
                postRes.setUpdatedAt(post.getUpdatedAt());
                return postRes;
            }).collect(Collectors.toList());

            // Fetch all comments by user
            List<Comment> comments = commentService.getCommentsByUser(user);
            List<CommentResponse> commentResponses = comments.stream().map(comment -> {
                CommentResponse commentRes = new CommentResponse();
                commentRes.setCommentId(comment.getId());
                commentRes.setContent(comment.getContent());
                commentRes.setUserId(comment.getUser().getId());
                commentRes.setPostId(comment.getPost().getPostId());
                commentRes.setCreatedAt(comment.getCreatedAt());
                return commentRes;
            }).collect(Collectors.toList());

            // Compose the user profile response DTO
            UserProfileResponse profile = new UserProfileResponse();
            profile.setId(user.getId());
            profile.setNickname(user.getNickname());
            profile.setCreatedAt(user.getCreatedAt());
            profile.setPosts(postResponses);
            profile.setComments(commentResponses);

            return ResponseEntity.ok(new ApiResponseCustom<>(200, "User profile fetched successfully", profile));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ApiResponseCustom<>(404, e.getMessage(), null));
        }
    }


    //이거는 POST지만 auth가 있어서는 안됨 - 그대로 둠
    @PostMapping("/verify/id")
    @Operation(summary = "유저 검증", description = "해당 유저가 존재하는 지 파악합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "User exists",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "User exists",
                        "data": true
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "User ID is required",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 400,
                        "message": "User ID is required",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User does not exist",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 404,
                        "message": "User does not exist",
                        "data": false
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<Boolean>> verify(@RequestBody VerifyIDRequest request) {
        if (request.getId() == null || request.getId().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "User ID is required", null));
        }

        boolean exists = userRepository.existsById(request.getId());
        if (exists) {
            return ResponseEntity.ok(new ApiResponseCustom<>(200, "User exists", true));
        } else {
            return ResponseEntity.status(404).body(new ApiResponseCustom<>(404, "User does not exist", false));
        }
    }

    //이거는 POST지만 auth가 있어서는 안됨 - 그대로 둠
    @PostMapping("/verify/nickname")
    @Operation(summary = "닉네임 검증", description = "해당 닉네임이 사용 중인지 확인합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Nickname is available",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Nickname is available",
                        "data": true
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Nickname is required",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 400,
                        "message": "Nickname is required",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "409",
            description = "Nickname is already in use",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 409,
                        "message": "Nickname is already in use",
                        "data": false
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<Boolean>> verifyNickname(@RequestBody VerifyNicknameRequest request) {
        if (request.getNickname() == null || request.getNickname().isEmpty()) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Nickname is required", null));
        }

        boolean exists = userRepository.existsByNickname(request.getNickname());
        if (exists) {
            return ResponseEntity.status(409).body(new ApiResponseCustom<>(409, "Nickname is already in use", false));
        } else {
            return ResponseEntity.ok(new ApiResponseCustom<>(200, "Nickname is available", true));
        }
    }


    
    @GetMapping("/all")
    @Operation(summary = "전체 회원 조회", description = "모든 회원 정보를 반환합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Fetched all users successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Fetched all users",
                        "data": [
                            {
                                "id": "user1",
                                "password": "hashedPassword1",
                                "nickname": "SKKUniv쓲빢",
                                "createdAt": "2023-01-01T12:00:00"
                            },
                            {
                                "id": "user2",
                                "password": "hashedPassword2",
                                "nickname": "SKKUniv리메",
                                "createdAt": "2023-01-02T12:00:00"
                            }
                        ]
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 500,
                        "message": "An error occurred while fetching users",
                        "data": null
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<List<UserResponse>>> getAllUsers() {
        try {
            List<UserResponse> users = userService.getAllUsers().stream().map(user -> {
                UserResponse response = new UserResponse();
                response.setId(user.getId());
                response.setNickname(user.getNickname());
                response.setCreatedAt(user.getCreatedAt());
                return response;
            }).toList();

            return ResponseEntity.ok(new ApiResponseCustom<>(200, "Fetched all users", users));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponseCustom<>(500, "An error occurred while fetching users", null));
        }
    }
}
