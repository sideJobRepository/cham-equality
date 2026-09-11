package com.chamapi.feedback.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.common.exception.UnauthorizedException;
import com.chamapi.feedback.dto.request.AppFeedbackCreateRequest;
import com.chamapi.feedback.dto.request.AppFeedbackUpdateRequest;
import com.chamapi.feedback.dto.response.AppFeedbackDetailResponse;
import com.chamapi.feedback.dto.response.AppFeedbackListResponse;
import com.chamapi.feedback.service.AppFeedbackService;
import com.chamapi.util.JwtParserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 앱 피드백 창구(비공개 테스트 피드백 수집). 접수와 작성자 본인의 조회·수정·삭제를 담당하고,
 * 상태 전이와 처리 메모는 관리자 웹({@link com.chamapi.admin.controller.AdminAppFeedbackController})에서 한다.
 *
 * <p><b>앱이 알아야 할 계약</b>
 * <ul>
 *   <li><b>접수(POST)만 JWT가 선택</b>이다. 토큰을 보내면 작성자(MEMBER_ID)가 연결되고, 없으면 익명 접수된다.
 *       로그인을 강제하면 테스터 참여율이 떨어져 내린 결정이라 401로 막지 않는다.
 *       반대로 <b>조회·수정·삭제는 JWT 필수</b>다. 익명 접수 건은 작성자를 특정할 수 없어 조회 대상이 아니다.</li>
 *   <li>{@code /api/app/**}는 DB {@code URL_RESOURCES} 매핑이 없어 Spring Security 레벨에서는 permitAll이다.
 *       그래서 {@link #requireMemberId(Jwt)}가 실질 게이트 역할을 한다(형제 {@code ShelterInfoAppReportController}와 동일).</li>
 *   <li>스크린샷은 기존 3단계 흐름을 그대로 쓰되 <b>{@code fileType=FEEDBACK_IMAGE}</b>로 호출한다.
 *       {@code POST /api/presigned-url} → S3 PUT → {@code POST /api/upload-file}로 받은 fileId를
 *       본문 {@code imageFileIds}에 담아 보낸다. 최대 5장.</li>
 *   <li>{@code appVersion}/{@code platform}/{@code osVersion}/{@code deviceModel}은 앱이 자동 수집해 채운다
 *       (버그 재현에 쓰이므로 비워 보내지 말 것). {@code screen}은 작성 화면 이름(선택).</li>
 *   <li>{@code content}는 필수이며 2000자 제한. 위반 시 400.</li>
 *   <li>수정·삭제는 <b>접수(RECEIVED) 상태에서만</b> 된다. 관리자가 확인중/완료로 옮기면 400.</li>
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

    /** 내가 보낸 피드백 목록(최신순, 처리 상태 포함). */
    @GetMapping("/app/feedbacks")
    public ApiResponse<List<AppFeedbackListResponse>> getMyFeedbacks(@AuthenticationPrincipal Jwt jwt) {
        return new ApiResponse<>(200, true, appFeedbackService.findMyFeedbacks(requireMemberId(jwt)));
    }

    /** 내 피드백 상세(본문 + 첨부 스크린샷). 본인 소유만. 관리자 메모는 내려가지 않는다. */
    @GetMapping("/app/feedbacks/{id}")
    public ApiResponse<AppFeedbackDetailResponse> getMyFeedbackDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return new ApiResponse<>(200, true, appFeedbackService.getMyDetail(id, requireMemberId(jwt)));
    }

    /** 내 피드백 수정. 본인 소유 + 접수 상태에서만 허용(본문 + 사진). */
    @PutMapping("/app/feedbacks/{id}")
    public ApiResponse<Void> updateMyFeedback(
            @PathVariable Long id,
            @RequestBody AppFeedbackUpdateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        appFeedbackService.updateByMember(id, requireMemberId(jwt), request);
        return ApiResponse.of(200, true, "수정 완료");
    }

    /** 내 피드백 삭제. 본인 소유 + 접수 상태에서만 허용. */
    @DeleteMapping("/app/feedbacks/{id}")
    public ApiResponse<Void> deleteMyFeedback(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        appFeedbackService.deleteByMember(id, requireMemberId(jwt));
        return ApiResponse.of(200, true, "삭제 완료");
    }

    private Long requireMemberId(Jwt jwt) {
        Long memberId = JwtParserUtil.extractMemberId(jwt);
        if (memberId == null) {
            throw new UnauthorizedException("로그인이 필요합니다");
        }
        return memberId;
    }
}
