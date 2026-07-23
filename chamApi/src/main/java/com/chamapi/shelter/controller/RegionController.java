package com.chamapi.shelter.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.shelter.dto.response.RegionOptionResponse;
import com.chamapi.shelter.service.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/regions")
@RequiredArgsConstructor
public class RegionController {

    private final RegionService regionService;

    @GetMapping
    public ApiResponse<List<RegionOptionResponse>> getRegions(
            @RequestParam int depth,
            @RequestParam(required = false) Long parentId
    ) {
        return ApiResponse.ok(regionService.getRegionsByDepth(depth, parentId));
    }
}
