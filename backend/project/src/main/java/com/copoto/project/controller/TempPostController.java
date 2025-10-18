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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.copoto.project.dto.ApiResponseCustom;
import com.copoto.project.dto.temp.TempPostRequest;
import com.copoto.project.dto.temp.TempPostResponse;
import com.copoto.project.entity.TempPost;
import com.copoto.project.entity.User;
import com.copoto.project.service.TempPostService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@RestController
@RequestMapping("/api/temp-post")
@CrossOrigin(origins = "http://localhost:3000")
public class TempPostController {

    @Autowired
    private TempPostService tempPostService;

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


    @Operation(
        summary = "임시저장 게시글 생성 - auth를 필요로 합니다",
        description = "임시저장 게시글을 등록합니다. 혐오 발언은 등록 거부됩니다."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "임시저장 성공-Temp post saved successfully(계정당 최대 10개, 알아서 FIFO 구조로 저장됩니다.)",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Temp post saved successfully",
                        "data": {
                            "id": 3,
                            "title": "임시저장하려는 글 제목",
                            "contents": "임시저장하려는 글 내용",
                            "createdAt": "2025-10-18T22:21:55.115684",
                            "updatedAt": "2025-10-18T22:21:55.115684"
                        }
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "ReqBody에 뭔가 부족 - Title or Content or Type is required",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 400,
                        "message": "Contents are required 또는 무수한 긴 에러 로그",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "405",
            description = "혐오표현 탐지",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 405,
                        "message": "혐오 발언이 감지되어 임시저장글이 등록되지 않았습니다.",
                        "data": null
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
    @PostMapping("/save")
    public ResponseEntity<ApiResponseCustom<TempPostResponse>> saveTempPost(
            @RequestBody TempPostRequest request,
            Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User))
            return ResponseEntity.status(401).body(new ApiResponseCustom<>(401, "User not authenticated", null));

        // 필수값 체크
        if (request.getTitle() == null || request.getTitle().trim().isEmpty())
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Title is required", null));
        if (request.getContents() == null || request.getContents().trim().isEmpty())
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "Contents are required", null));

        // 혐오표현 검수
        if (isHateSpeech(request.getTitle()) || isHateSpeech(request.getContents()))
            return ResponseEntity.status(405).body(new ApiResponseCustom<>(405, "혐오 발언이 감지되어 임시저장글이 등록되지 않았습니다.", null));

        User user = (User) authentication.getPrincipal();
        TempPost saved;
        try {
            saved = tempPostService.saveTempPost(user, request.getTitle(), request.getContents());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponseCustom<>(500, "Internal server error: " + e.getMessage(), null));
        }

        TempPostResponse response = new TempPostResponse();
        response.setId(saved.getId());
        response.setTitle(saved.getTitle());
        response.setContents(saved.getContents());
        response.setCreatedAt(saved.getCreatedAt());
        response.setUpdatedAt(saved.getUpdatedAt());

        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Temp post saved successfully", response));
    }


    @Operation(
        summary = "유저의 모든 임시저장 글,댓글 목록을 가져옵니다 - GET이지만 auth를 필요로 합니다",
        description = "임시저장 게시글과 댓글을 리스트로 전부 다 가져옵니다"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "임시저장 리스트 가져오기 성공-Fetched temp posts successfully(계정당 최대 10개, 알아서 FIFO 구조로 저장됩니다.)",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Fetched temp posts successfully",
                        "data": [
                            {
                                "id": 15,
                                "title": "다른계정으로 임시저장하려는 글 제목",
                                "contents": "다른계정으로 임시저장하려는 wkwl 글 내용",
                                "createdAt": "2025-10-18T22:28:59.361673",
                                "updatedAt": "2025-10-18T22:28:59.361673"
                            },
                            {
                                "id": 14,
                                "title": "다른계정으로 임시저장하려는 글 제목",
                                "contents": "다른계정으로 임시저장하려는 글 내용",
                                "createdAt": "2025-10-18T22:28:34.303921",
                                "updatedAt": "2025-10-18T22:28:34.303921"
                            },
                            {
                                "id": 13,
                                "title": "다른계정으로 임시저장하려는 글 제목",
                                "contents": "다른계정으로 임시저장하려는 글 내용",
                                "createdAt": "2025-10-18T22:28:29.539842",
                                "updatedAt": "2025-10-18T22:28:29.539842"
                            },
                            {
                                "id": 12,
                                "title": "다른계정으로 임시저장하려는 글 제목",
                                "contents": "다른계정으로 임시저장하려는 글 내용",
                                "createdAt": "2025-10-18T22:26:12.37825",
                                "updatedAt": "2025-10-18T22:26:12.37825"
                            }
                        ]
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
    @GetMapping("/list")
    public ResponseEntity<ApiResponseCustom<List<TempPostResponse>>> listTempPosts(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User))
            return ResponseEntity.status(401).body(new ApiResponseCustom<>(401, "User not authenticated", null));

        User user = (User) authentication.getPrincipal();
        List<TempPostResponse> list;
        try {
            list = tempPostService.getTempList(user)
                    .stream()
                    .map(tp -> {
                        TempPostResponse r = new TempPostResponse();
                        r.setId(tp.getId());
                        r.setTitle(tp.getTitle());
                        r.setContents(tp.getContents());
                        r.setCreatedAt(tp.getCreatedAt());
                        r.setUpdatedAt(tp.getUpdatedAt());
                        return r;
                    }).collect(Collectors.toList());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponseCustom<>(500, "Internal server error: " + e.getMessage(), null));
        }

        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Fetched temp posts successfully", list));
    }


    @Operation(
        summary = "특정 임시저장 게시글 가져오기 - GET이지만 auth를 필요로 합니다",
        description = "원하는 임시저장 게시글 제목과 내용을 가져옵니다."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "원하는 임시저장 글 내용 가져오기 성공",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Fetched temp post successfully",
                        "data": {
                            "id": 14,
                            "title": "다른계정으로 임시저장하려는 글 제목",
                            "contents": "다른계정으로 임시저장하려는 글 내용",
                            "createdAt": "2025-10-18T22:28:34.303921",
                            "updatedAt": "2025-10-18T22:28:34.303921"
                        }
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "임시저장 글 목록에 없음. 없는 번호를 보내셨어요",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 400,
                        "message": "TempPost not found",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "403",
            description = "본인의 임시저장 글이 아닙니다",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 403,
                        "message": "You are not allowed to access this temp post.",
                        "data": null
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
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseCustom<TempPostResponse>> getTempPost(
            @PathVariable("id") Long id,
            Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User))
            return ResponseEntity.status(401).body(new ApiResponseCustom<>(401, "User not authenticated", null));

        User user = (User) authentication.getPrincipal();
        TempPost post;
        try {
            post = tempPostService.getTempPost(id, user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "TempPost not found", null));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(new ApiResponseCustom<>(403, "You are not allowed to access this temp post.", null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponseCustom<>(500, "Internal server error: " + e.getMessage(), null));
        }

        TempPostResponse response = new TempPostResponse();
        response.setId(post.getId());
        response.setTitle(post.getTitle());
        response.setContents(post.getContents());
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());

        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Fetched temp post successfully", response));
    }


    @Operation(
        summary = "특정 임시저장 게시글 삭제하기 - auth를 필요로 합니다",
        description = "원하는 임시저장 게시글 제목과 내용을 지웁니다."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "원하는 임시저장 글 내용 지우기 성공",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 200,
                        "message": "Deleted temp post successfully",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "임시저장 글 목록에 없음. 없는 번호를 보내셨어요",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 400,
                        "message": "TempPost not found",
                        "data": null
                    }
                """)
            )
        ),
        @ApiResponse(
            responseCode = "403",
            description = "본인의 임시저장 글이 아닙니다",
            content = @Content(mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                        "status": 403,
                        "message": "You are not allowed to delete this temp post.",
                        "data": null
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
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseCustom<Void>> deleteTempPost(
            @PathVariable("id") Long id,
            Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User))
            return ResponseEntity.status(401).body(new ApiResponseCustom<>(401, "User not authenticated", null));

        User user = (User) authentication.getPrincipal();
        try {
            tempPostService.deleteTempPost(id, user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ApiResponseCustom<>(400, "TempPost not found", null));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(new ApiResponseCustom<>(403, "You are not allowed to delete this temp post.", null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponseCustom<>(500, "Internal server error: " + e.getMessage(), null));
        }

        return ResponseEntity.ok(new ApiResponseCustom<>(200, "Deleted temp post successfully", null));
    }
}
