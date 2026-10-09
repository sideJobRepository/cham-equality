package com.chamapi.admin.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.common.dto.PageResponse;
import com.chamapi.push.dto.request.MemberPushRequest;
import com.chamapi.push.dto.response.AdminMemberResponse;
import com.chamapi.push.service.MemberPushService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

/**
 * 관리자 회원 조회 + 회원 지정 푸시.
 * {@code /api/admin/**}라 {@code AdminAuthInterceptor}가 {@code X-Admin-Password}를 요구한다.
 */
@RestController
@RequestMapping("/api/admin/members")
@RequiredArgsConstructor
public class AdminMemberController {

    private final MemberPushService memberPushService;

    /** 회원 목록. keyword는 이름·이메일 부분 일치. 가입 최신순. */
    @GetMapping
    public ApiResponse<PageResponse<AdminMemberResponse>> getMembers(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return new ApiResponse<>(200, true, memberPushService.findMembers(keyword, pageable));
    }

    /** 회원의 모든 기기에 알림 발송. 응답 data는 실제로 보낸 기기 수. */
    @PostMapping("/{memberId}/push")
    public ApiResponse<Integer> sendPush(@PathVariable Long memberId, @RequestBody MemberPushRequest request) {
        return new ApiResponse<>(200, true, memberPushService.sendToMember(memberId, request));
    }
}
