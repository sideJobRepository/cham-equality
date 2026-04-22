package com.chamapi.admin.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.common.dto.PageResponse;
import com.chamapi.shelter.dto.response.ShelterReportDetailResponse;
import com.chamapi.shelter.dto.response.ShelterReportListResponse;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;
import com.chamapi.shelter.service.ShelterInfoReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

/**
 * 관리자 전용 대피소 신고 검토 API(목록/상세/승인/반려).
 * 시민 공개 API({@link com.chamapi.shelter.controller.ShelterInfoReportController})와
 * 동일한 {@link ShelterInfoReportService}를 공유하며, 승인·반려의 정책(다른 PENDING 자동 반려,
 * 파일은 배치가 수거 등)은 서비스 Javadoc을 참고.
 */
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminShelterReportController {

    private final ShelterInfoReportService shelterInfoReportService;

    /** 신고 목록. status 미지정 시 전체, 지정 시 해당 상태만. 최신순 고정. */
    @GetMapping
    public ApiResponse<PageResponse<ShelterReportListResponse>> getReports(
            @RequestParam(required = false) ShelterInfoReportStatus status,
            @PageableDefault(size = 20, sort = "createDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return new ApiResponse<>(200, true, shelterInfoReportService.findReports(status, pageable));
    }

    /** 신고 상세(본문 + 대피소 + 첨부 이미지 Presigned URL). 시민 API와 동일 핸들러 재사용. */
    @GetMapping("/{id}")
    public ApiResponse<ShelterReportDetailResponse> getReportDetail(@PathVariable Long id) {
        return new ApiResponse<>(200, true, shelterInfoReportService.getReportDetail(id));
    }

    /** 승인. 같은 대피소의 다른 PENDING 신고는 같은 트랜잭션에서 자동 반려된다. */
    @PostMapping("/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Long id) {
        shelterInfoReportService.approve(id);
        return ApiResponse.of(200, true, "승인 완료");
    }

    /** 반려. 첨부 이미지는 즉시 삭제하지 않고 TEMPORARY로 되돌려 일일 정리 배치가 수거한다. */
    @PostMapping("/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Long id) {
        shelterInfoReportService.reject(id);
        return ApiResponse.of(200, true, "반려 완료");
    }
}
