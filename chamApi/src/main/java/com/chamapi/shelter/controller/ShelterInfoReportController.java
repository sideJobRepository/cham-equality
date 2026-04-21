package com.chamapi.shelter.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.shelter.dto.request.ShelterInfoReportCreateRequest;
import com.chamapi.shelter.service.ShelterInfoReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shelter-reports")
@RequiredArgsConstructor
public class ShelterInfoReportController {

    private final ShelterInfoReportService shelterInfoReportService;

    @PostMapping
    public ApiResponse<Long> createReport(@RequestBody ShelterInfoReportCreateRequest request) {
        Long id = shelterInfoReportService.createReport(request);
        return new ApiResponse<>(200, true, id);
    }
}
