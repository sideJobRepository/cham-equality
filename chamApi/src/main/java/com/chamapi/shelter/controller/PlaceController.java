package com.chamapi.shelter.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.shelter.dto.response.PlaceBoundaryResponse;
import com.chamapi.shelter.service.PlaceBoundaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 장소 단건 부가 정보(공개). 지도 목록 응답을 가볍게 두려고 경계는 선택한 장소만 따로 받는다. */
@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
public class PlaceController {

    private final PlaceBoundaryService placeBoundaryService;

    /** 장소 부지 경계. 없으면 geoJson 이 null. */
    @GetMapping("/{placeId}/boundary")
    public ApiResponse<PlaceBoundaryResponse> getBoundary(@PathVariable Long placeId) {
        return ApiResponse.ok(placeBoundaryService.getBoundary(placeId));
    }
}
