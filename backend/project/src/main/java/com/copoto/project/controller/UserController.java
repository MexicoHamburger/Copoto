package com.copoto.project.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.copoto.project.dto.ApiResponseCustom;
import com.copoto.project.dto.LoginRequest;
import com.copoto.project.dto.RegisterRequest;
import com.copoto.project.dto.UserResponse;
import com.copoto.project.dto.VerifyIDRequest;
import com.copoto.project.dto.VerifyNicknameRequest;
import com.copoto.project.entity.RefreshToken;
import com.copoto.project.entity.User;
import com.copoto.project.repository.RefreshTokenRepository;
import com.copoto.project.repository.UserRepository;
import com.copoto.project.security.JwtTokenProvider;
import com.copoto.project.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:3000") // React의 도메인 주소
@Tag(name = "User API", description = "회원 관리 API")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @PostMapping("/register")
    @Operation(summary = "회원 가입", description = "새로운 회원을 등록합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "User registered successfully",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "User registered successfully",
                        "data": {
                            "id": "user123",
                            "password": "Password",
                            "nickname": "SKKUniv쓲빢",
                            "createdAt": "2023-01-01T12:00:00"
                        }
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "User ID or Password is missing",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 400,
                        "message": "User ID or Password is required",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "501",
            description = "User ID is already in used",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 500,
                        "message": "User ID is already in used",
                        "data": null
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
    @Operation(summary = "로그인", description = "회원 로그인 기능을 제공합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Login successful",
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
            description = "User ID or Password is missing",
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
            description = "Invalid credentials",
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
    public ResponseEntity<ApiResponseCustom<Map<String, String>>> refreshToken(@RequestBody Map<String, String> request) {
        String requestRefreshToken = request.get("refreshToken");

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
            return ResponseEntity.status(403).body(new ApiResponseCustom<>(403, "Refresh token not found.", emptyMap));
        }
    }




    @PostMapping("/logout")
    @Operation(summary = "로그아웃", description = "현재 세션을 없애 로그아웃 기능을 제공합니다.")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Logout successful",
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
            responseCode = "400",
            description = "already no session",
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

    @GetMapping("/profile/{user_id}")
    @Operation(summary = "개인 프로필", description = "현재 로그인되어있는 유저의 프로필을 가져옵니다")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "User profile found",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                        {
                            "status": 200,
                            "message": "User profile found",
                            "data": {
                                "id": "kangsc9336",
                                "password": "gomsupak12!",
                                "nickname": "곰수팍젤리존맛",
                                "createdAt": "2025-01-09T15:43:17.402514"
                            }
                        }
                    """)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Not logged in",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 401,
                        "message": "Not logged in",
                        "data": null
                    }
                """)
            )
        )
    })
    public ResponseEntity<ApiResponseCustom<UserResponse>> getUserProfile(
        Authentication authentication,
        @PathVariable("user_id") String id
    ) {
        // 인증된 유저 정보(JWT에서 추출)
        User loggedInUser = null;
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            loggedInUser = (User) authentication.getPrincipal();
        }
        UserResponse userResponse = new UserResponse();
        try {
            User target_user = userService.getUserById(id);
            // 본인이 본인 정보 조회일 때
            if (loggedInUser != null && loggedInUser.getId().equals(id)) {
                userResponse.setId(loggedInUser.getId());
                userResponse.setNickname(loggedInUser.getNickname());
                userResponse.setCreatedAt(loggedInUser.getCreatedAt());
            } else {
                // 타인의 정보 조회(특정 정보 제한 필요)
                userResponse.setNickname(target_user.getNickname());
                userResponse.setCreatedAt(target_user.getCreatedAt());
            }
        } catch(IllegalArgumentException e) {
            return ResponseEntity.status(401)
                .body(new ApiResponseCustom<>(401, "User not found with ID", null));
        }
        return ResponseEntity.ok(new ApiResponseCustom<>(200, "User profile found", userResponse));
    }


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
