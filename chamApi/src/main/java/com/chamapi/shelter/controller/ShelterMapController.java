package com.chamapi.shelter.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.shelter.dto.query.NearestShelterCondition;
import com.chamapi.shelter.dto.query.ShelterSearchCondition;
import com.chamapi.shelter.dto.request.NearestShelterRequest;
import com.chamapi.shelter.dto.request.ShelterMapSearchRequest;
import com.chamapi.shelter.dto.response.ShelterAggregateResponse;
import com.chamapi.shelter.dto.response.ShelterMapResponse;
import com.chamapi.shelter.service.ShelterMapService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
@RequestMapping("/api/shelters/map")
@RequiredArgsConstructor
public class ShelterMapController {

    private final ShelterMapService shelterMapService;

    @PostMapping
    public ApiResponse<ShelterAggregateResponse> getShelterForMap(
            @RequestBody ShelterMapSearchRequest request,
            @RequestParam(defaultValue = "KO") Language lang
    ) {
        ShelterSearchCondition condition = request.toCondition();
        ShelterAggregateResponse aggregate = shelterMapService.aggregate(condition, request.accessibilityFeatures(), lang);
        return ApiResponse.ok(aggregate);
    }

    @PostMapping("/nearest")
    public ApiResponse<ShelterMapResponse> getNearestShelter(
            @RequestBody NearestShelterRequest request,
            @RequestParam(defaultValue = "KO") Language lang
    ) {
        NearestShelterCondition condition = request.toCondition();
        ShelterMapResponse nearest = shelterMapService.getNearest(condition, lang);
        return ApiResponse.ok(nearest);
    }

}
