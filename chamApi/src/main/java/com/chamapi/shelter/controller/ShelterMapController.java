package com.chamapi.shelter.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.shelter.dto.response.ShelterAggregateResponse;
import com.chamapi.shelter.service.ShelterMapService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shelters/map")
@RequiredArgsConstructor
public class ShelterMapController {

    private final ShelterMapService shelterMapService;

    @GetMapping
    public ApiResponse<ShelterAggregateResponse> getShelterForMap(){
        ShelterAggregateResponse aggregate = shelterMapService.aggregate();
        return new ApiResponse<>(200, true, aggregate);
    }

}
