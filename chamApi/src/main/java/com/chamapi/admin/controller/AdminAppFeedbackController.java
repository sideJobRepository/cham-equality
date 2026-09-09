package com.chamapi.admin.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.common.dto.PageResponse;
import com.chamapi.feedback.dto.request.AppFeedbackAdminUpdateRequest;
import com.chamapi.feedback.dto.response.AppFeedbackDetailResponse;
import com.chamapi.feedback.dto.response.AppFeedbackListResponse;
import com.chamapi.feedback.enums.AppFeedbackStatus;
import com.chamapi.feedback.service.AppFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

/**
 * 관리자 전용 앱 피드백 조회·처리 API. 시민 접수 API
 * ({@link com.chamapi.feedback.controller.AppFeedbackController})와 같은 서비스를 공유한다.
 *
 * <p>이 경로는 {@code AdminWebConfig}가 등록한 {@code AdminAuthInterceptor}가 {@code /api/admin/**} 전체에
 * 걸려 있어 {@code X-Admin-Password} 없이는 401이다.
 */
@RestController
@RequestMapping("/api/admin/feedbacks")
@RequiredArgsConstructor
public class AdminAppFeedbackController {

    private final AppFeedbackService appFeedbackService;

    /** 피드백 목록. filter 미지정 시 전체. 최신순 고정. */
    @GetMapping
    public ApiResponse<PageResponse<AppFeedbackListResponse>> getFeedbacks(
            @RequestParam(required = false) AppFeedbackStatus filter,
            @PageableDefault(size = 20, sort = "createDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return new ApiResponse<>(200, true, appFeedbackService.findFeedbacks(filter, pageable));
    }

    /** 피드백 상세(본문 + 작성자 + 첨부 스크린샷 Presigned URL). */
    @GetMapping("/{id}")
    public ApiResponse<AppFeedbackDetailResponse> getFeedbackDetail(@PathVariable Long id) {
        return new ApiResponse<>(200, true, appFeedbackService.getDetail(id));
    }

    /** 처리 상태 전이 + 관리자 메모 저장. */
    @PutMapping("/{id}")
    public ApiResponse<Void> update(@PathVariable Long id, @RequestBody AppFeedbackAdminUpdateRequest request) {
        appFeedbackService.updateByAdmin(id, request);
        return ApiResponse.of(200, true, "저장 완료");
    }
}
