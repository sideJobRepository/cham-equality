package com.chamapi.feedback.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.feedback.dto.request.AppFeedbackCreateRequest;
import com.chamapi.feedback.service.AppFeedbackService;
import com.chamapi.util.JwtParserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 앱 피드백 창구(비공개 테스트 피드백 수집). 접수만 담당하고 조회·처리는 관리자 웹
 * ({@link com.chamapi.admin.controller.AdminAppFeedbackController})에서 한다.
 *
 * <p><b>앱이 알아야 할 계약</b>
 * <ul>
 *   <li><b>JWT는 선택</b>이다. 토큰을 보내면 작성자(MEMBER_ID)가 연결되고, 없으면 익명 접수된다.
 *       로그인을 강제하면 테스터 참여율이 떨어져 내린 결정이라 401로 막지 않는다.</li>
 *   <li>스크린샷은 기존 3단계 흐름을 그대로 쓰되 <b>{@code fileType=FEEDBACK_IMAGE}</b>로 호출한다.
 *       {@code POST /api/presigned-url} → S3 PUT → {@code POST /api/upload-file}로 받은 fileId를
 *       본문 {@code imageFileIds}에 담아 보낸다. 최대 5장.</li>
 *   <li>{@code appVersion}/{@code platform}/{@code osVersion}/{@code deviceModel}은 앱이 자동 수집해 채운다
 *       (버그 재현에 쓰이므로 비워 보내지 말 것). {@code screen}은 작성 화면 이름(선택).</li>
 *   <li>{@code content}는 필수이며 2000자 제한. 위반 시 400.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AppFeedbackController {

    private final AppFeedbackService appFeedbackService;

    /** 피드백 접수. 로그인 여부와 무관하게 허용하고, 토큰이 있으면 작성자를 연결한다. */
    @PostMapping("/app/feedbacks")
    public ApiResponse<Long> create(
            @RequestBody AppFeedbackCreateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return new ApiResponse<>(200, true, appFeedbackService.create(request, JwtParserUtil.extractMemberId(jwt)));
    }
}
