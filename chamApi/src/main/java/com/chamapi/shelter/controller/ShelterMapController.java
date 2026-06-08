package com.chamapi.shelter.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.shelter.dto.query.ShelterSearchCondition;
import com.chamapi.shelter.dto.request.ShelterMapSearchRequest;
import com.chamapi.shelter.dto.response.ShelterAggregateResponse;
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
        ShelterAggregateResponse aggregate = shelterMapService.aggregate(condition);
        return new ApiResponse<>(200, true, aggregate);
    }

}
