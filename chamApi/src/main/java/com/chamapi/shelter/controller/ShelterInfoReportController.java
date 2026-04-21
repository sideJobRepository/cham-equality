package com.chamapi.shelter.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.shelter.auth.UserPasswordValidator;
import com.chamapi.shelter.dto.request.ShelterInfoReportCreateRequest;
import com.chamapi.shelter.dto.request.ShelterInfoReportUpdateRequest;
import com.chamapi.shelter.dto.response.ShelterReportDetailResponse;
import com.chamapi.shelter.dto.response.ShelterReportListResponse;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;
import com.chamapi.shelter.service.ShelterInfoReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/shelter-reports")
@RequiredArgsConstructor
public class ShelterInfoReportController {

    private final ShelterInfoReportService shelterInfoReportService;
    private final UserPasswordValidator userPasswordValidator;

    @PostMapping
    public ApiResponse<Long> createReport(@RequestBody ShelterInfoReportCreateRequest request) {
        Long id = shelterInfoReportService.createReport(request);
        return new ApiResponse<>(200, true, id);
    }

    @GetMapping("/shelter/{shelterId}")
    public ApiResponse<List<ShelterReportListResponse>> getByShelter(
            @PathVariable Long shelterId,
            @RequestParam(defaultValue = "PENDING") ShelterInfoReportStatus status
    ) {
        return new ApiResponse<>(200, true,
                shelterInfoReportService.findByShelterAndStatus(shelterId, status));
    }

    @GetMapping("/{id}")
    public ApiResponse<ShelterReportDetailResponse> getReportDetail(@PathVariable Long id) {
        return new ApiResponse<>(200, true, shelterInfoReportService.getReportDetail(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateReport(
            @PathVariable Long id,
            @RequestBody ShelterInfoReportUpdateRequest request,
            @RequestHeader(value = UserPasswordValidator.HEADER_NAME, required = false) String password
    ) {
        userPasswordValidator.validate(password);
        shelterInfoReportService.updateReport(id, request);
        return ApiResponse.of(200, true, "수정 완료");
    }
}
