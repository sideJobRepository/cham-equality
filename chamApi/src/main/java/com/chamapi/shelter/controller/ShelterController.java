package com.chamapi.shelter.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.common.dto.PageResponse;
import com.chamapi.shelter.dto.response.ShelterListResponse;
import com.chamapi.shelter.service.ShelterService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shelters")
@RequiredArgsConstructor
public class ShelterController {

    private final ShelterService shelterService;

    @GetMapping
    public ApiResponse<PageResponse<ShelterListResponse>> getShelters(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return new ApiResponse<>(200, true, shelterService.findShelters(pageable));
    }
}
