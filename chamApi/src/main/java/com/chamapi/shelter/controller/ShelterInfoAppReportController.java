package com.chamapi.shelter.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.common.exception.UnauthorizedException;
import com.chamapi.shelter.dto.request.ShelterInfoAppReportCreateRequest;
import com.chamapi.shelter.dto.request.ShelterInfoAppReportUpdateRequest;
import com.chamapi.shelter.dto.response.ShelterAppReportDetailResponse;
import com.chamapi.shelter.dto.response.ShelterAppReportListResponse;
import com.chamapi.shelter.service.ShelterInfoAppReportService;
import com.chamapi.util.JwtParserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 앱에서 로그인한 시민이 자기 대피소 정보 제보를 다루는 API. 제보하기, 내 제보 목록·상세, 내 제보 수정.
 * 제보자는 요청 본문이 아니라 JWT에서 추출한 회원 ID로 식별하며, 토큰이 없으면 401.
 * 승인/반려는 관리자(기존 관리자 웹) 몫이라 여기 없다.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ShelterInfoAppReportController {

    private final ShelterInfoAppReportService shelterInfoAppReportService;

    /** 제보 생성. */
    @PostMapping("/app/shelter-reports")
    public ApiResponse<Long> createReport(@RequestBody ShelterInfoAppReportCreateRequest request, @AuthenticationPrincipal Jwt jwt) {
        return new ApiResponse<>(200, true, shelterInfoAppReportService.createReport(request, requireMemberId(jwt)));
    }

    /** 내가 제보한 목록(최신순, 상태 포함). */
    @GetMapping("/app/shelter-reports")
    public ApiResponse<List<ShelterAppReportListResponse>> getMyReports(@AuthenticationPrincipal Jwt jwt) {
        return new ApiResponse<>(200, true, shelterInfoAppReportService.findMyReports(requireMemberId(jwt)));
    }

    /** 내 제보 상세(본문 + 대피소 + 첨부 이미지). 본인 소유만. */
    @GetMapping("/app/shelter-reports/{id}")
    public ApiResponse<ShelterAppReportDetailResponse> getMyReportDetail(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return new ApiResponse<>(200, true, shelterInfoAppReportService.getMyReportDetail(id, requireMemberId(jwt)));
    }

    /** 내 제보 수정. 본인 소유 + PENDING 상태에서만 허용(본문 + 사진). */
    @PutMapping("/app/shelter-reports{id}")
    public ApiResponse<Void> updateReport(@PathVariable Long id, @RequestBody ShelterInfoAppReportUpdateRequest request, @AuthenticationPrincipal Jwt jwt) {
        shelterInfoAppReportService.updateReport(id, requireMemberId(jwt), request);
        return ApiResponse.of(200, true, "수정 완료");
    }

    private Long requireMemberId(Jwt jwt) {
        Long memberId = JwtParserUtil.extractMemberId(jwt);
        if (memberId == null) {
            throw new UnauthorizedException("로그인이 필요합니다");
        }
        return memberId;
    }
}
