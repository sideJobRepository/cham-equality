package com.chamapi.admin.controller;

import com.chamapi.admin.dto.request.AdminShelterUpdateRequest;
import com.chamapi.admin.service.AdminShelterService;
import com.chamapi.common.dto.ApiResponse;
import com.chamapi.common.dto.PageResponse;
import com.chamapi.shelter.dto.response.ShelterListResponse;
import com.chamapi.shelter.enums.ShelterSearchFilter;
import com.chamapi.shelter.service.ShelterService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

/**
 * 관리자 전용 대피소 직접 편집 API.
 * 시민이 수정할 수 없는 시설명/건축년도/대피소타입을 관리자만 변경할 수 있다.
 * 목록 조회는 시민 공개용과 동일한 {@link ShelterService}를 재사용한다(검색·페이지네이션 동일).
 */
@RestController
@RequestMapping("/api/admin/shelters")
@RequiredArgsConstructor
public class AdminShelterController {

    private final AdminShelterService adminShelterService;
    private final ShelterService shelterService;

    @GetMapping
    public ApiResponse<PageResponse<ShelterListResponse>> getShelters(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ShelterSearchFilter filter,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return new ApiResponse<>(200, true, shelterService.findShelters(keyword, filter, pageable));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateShelter(
            @PathVariable Long id,
            @RequestBody AdminShelterUpdateRequest request
    ) {
        adminShelterService.updateAdminEditableFields(id, request);
        return ApiResponse.of(200, true, "수정 완료");
    }
}
