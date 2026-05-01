package com.chamapi.shelter.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.common.dto.PageResponse;
import com.chamapi.shelter.dto.response.ShelterListResponse;
import com.chamapi.shelter.enums.ShelterSearchFilter;
import com.chamapi.shelter.service.ShelterService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 시민 공개용 대피소 목록 API.
 */
@RestController
@RequestMapping("/api/shelters")
@RequiredArgsConstructor
public class ShelterController {

    private final ShelterService shelterService;

    /** 대피소 목록 조회 */
    @GetMapping
    public ApiResponse<PageResponse<ShelterListResponse>> getShelters(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ShelterSearchFilter filter,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return new ApiResponse<>(200, true, shelterService.findShelters(keyword, filter, pageable));
    }
}
