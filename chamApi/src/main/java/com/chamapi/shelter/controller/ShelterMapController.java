package com.chamapi.shelter.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.shelter.dto.query.NearestShelterCondition;
import com.chamapi.shelter.dto.query.ShelterSearchCondition;
import com.chamapi.shelter.dto.request.NearestShelterRequest;
import com.chamapi.shelter.dto.request.ShelterMapSearchRequest;
import com.chamapi.shelter.dto.response.ShelterAggregateResponse;
import com.chamapi.shelter.dto.response.ShelterMapResponse;
import com.chamapi.shelter.service.ShelterMapService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shelters/map")
@RequiredArgsConstructor
public class ShelterMapController {

    private final ShelterMapService shelterMapService;

    @PostMapping
    public ApiResponse<ShelterAggregateResponse> getShelterForMap(
            @RequestBody ShelterMapSearchRequest request
    ) {
        ShelterSearchCondition condition = request.toCondition();
        ShelterAggregateResponse aggregate = shelterMapService.aggregate(condition, request.accessibilityFeatures());
        return ApiResponse.ok(aggregate);
    }

    @PostMapping("/nearest")
    public ApiResponse<ShelterMapResponse> getNearestShelter(
            @RequestBody NearestShelterRequest request
    ) {
        NearestShelterCondition condition = request.toCondition();
        ShelterMapResponse nearest = shelterMapService.getNearest(condition);
        return ApiResponse.ok(nearest);
    }

}
