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

/**
 * 시민이 제출하는 대피소 정보 제보(신고) 공개 API.
 * 관리자 승인/반려/목록 API는 {@code admin} 모듈의 별도 컨트롤러에서 제공한다.
 */
@RestController
@RequestMapping("/api/shelter-reports")
@RequiredArgsConstructor
public class ShelterInfoReportController {

    private final ShelterInfoReportService shelterInfoReportService;
    private final UserPasswordValidator userPasswordValidator;

    /** 신고 생성. 인증 없이 누구나 제출 가능하며 생성된 리포트 ID를 돌려준다. */
    @PostMapping
    public ApiResponse<Long> createReport(@RequestBody ShelterInfoReportCreateRequest request) {
        Long id = shelterInfoReportService.createReport(request);
        return new ApiResponse<>(200, true, id);
    }

    /** 특정 대피소의 신고 목록. 프론트 목록 화면에서 기본 PENDING만 노출하므로 status 기본값도 PENDING. */
    @GetMapping("/shelter/{shelterId}")
    public ApiResponse<List<ShelterReportListResponse>> getByShelter(
            @PathVariable Long shelterId,
            @RequestParam(defaultValue = "PENDING") ShelterInfoReportStatus status
    ) {
        return new ApiResponse<>(200, true,
                shelterInfoReportService.findByShelterAndStatus(shelterId, status));
    }

    /** 신고 단건 상세. 대피소 정보 + 첨부 이미지의 Presigned GET URL을 합쳐 반환한다. */
    @GetMapping("/{id}")
    public ApiResponse<ShelterReportDetailResponse> getReportDetail(@PathVariable Long id) {
        return new ApiResponse<>(200, true, shelterInfoReportService.getReportDetail(id));
    }

    /**
     * 제출자가 본인의 신고를 수정. 익명 제출 구조라 {@code X-User-Password} 헤더가 유일한 편집 권한이다.
     * 수정은 PENDING 상태에서만 허용된다(서비스에서 verifyPending 검증).
     */
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
