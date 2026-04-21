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

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminShelterReportController {

    private final ShelterInfoReportService shelterInfoReportService;

    @GetMapping
    public ApiResponse<PageResponse<ShelterReportListResponse>> getReports(
            @RequestParam(required = false) ShelterInfoReportStatus status,
            @PageableDefault(size = 20, sort = "createDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return new ApiResponse<>(200, true, shelterInfoReportService.findReports(status, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<ShelterReportDetailResponse> getReportDetail(@PathVariable Long id) {
        return new ApiResponse<>(200, true, shelterInfoReportService.getReportDetail(id));
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Long id) {
        shelterInfoReportService.approve(id);
        return ApiResponse.of(200, true, "승인 완료");
    }

    @PostMapping("/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Long id) {
        shelterInfoReportService.reject(id);
        return ApiResponse.of(200, true, "반려 완료");
    }
}
