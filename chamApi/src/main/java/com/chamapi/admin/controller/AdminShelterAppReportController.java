package com.chamapi.admin.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.common.dto.PageResponse;
import com.chamapi.shelter.dto.response.ShelterAppReportDetailResponse;
import com.chamapi.shelter.dto.response.ShelterAppReportListResponse;
import com.chamapi.shelter.enums.AdminReportFilter;
import com.chamapi.shelter.service.ShelterInfoAppReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

/**
 * 관리자 전용 앱 제보 검토 API(목록/상세/승인/반려).
 * 시민 앱 API({@link com.chamapi.shelter.controller.ShelterInfoAppReportController})와
 * 동일한 {@link ShelterInfoAppReportService}를 공유한다. 승인은 웹 제보와 동일하게 대피소에 반영된다.
 *
 * <p>주의: 이 경로(/api/admin/app-reports)는 동적 권한(URL_RESOURCES)에 매핑이 없으면 permitAll이 되므로,
 * 기존 /api/admin/reports와 동일 ROLE로 DB에 매핑을 추가해야 무인증 노출을 막는다.
 */
@RestController
@RequestMapping("/api/admin/app-reports")
@RequiredArgsConstructor
public class AdminShelterAppReportController {

    private final ShelterInfoAppReportService shelterInfoAppReportService;

    /** 앱 제보 목록. filter 미지정 시 전체. 최신순 고정. */
    @GetMapping
    public ApiResponse<PageResponse<ShelterAppReportListResponse>> getReports(
            @RequestParam(required = false) AdminReportFilter filter,
            @PageableDefault(size = 20, sort = "createDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return new ApiResponse<>(200, true, shelterInfoAppReportService.findReports(filter, pageable));
    }

    /** 앱 제보 상세(본문 + 대피소 + 첨부 이미지 Presigned URL). */
    @GetMapping("/{id}")
    public ApiResponse<ShelterAppReportDetailResponse> getReportDetail(@PathVariable Long id) {
        return new ApiResponse<>(200, true, shelterInfoAppReportService.getReportDetailForAdmin(id));
    }

    /** 승인. 본문을 대피소에 반영(INVESTIGATED) + 같은 대피소의 다른 PENDING 앱 제보 자동 반려. */
    @PostMapping("/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Long id) {
        shelterInfoAppReportService.approve(id);
        return ApiResponse.of(200, true, "승인 완료");
    }

    /** 반려. 첨부 이미지는 즉시 삭제하지 않고 TEMPORARY로 되돌려 일일 정리 배치가 수거한다. */
    @PostMapping("/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Long id) {
        shelterInfoAppReportService.reject(id);
        return ApiResponse.of(200, true, "반려 완료");
    }
}
