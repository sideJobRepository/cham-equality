package com.chamapi.dailysafety.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.dailysafety.dto.DailySafetySummaryResponse;
import com.chamapi.dailysafety.service.DailySafetyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/daily-safety")
@RequiredArgsConstructor
public class DailySafetyController {

    private final DailySafetyService dailySafetyService;

    /** 최신 일일 재난안전 요약. lang 으로 번역본 반환(기본 ko). */
    @GetMapping("/latest")
    public ApiResponse<DailySafetySummaryResponse> getLatest(@RequestParam(defaultValue = "ko") String lang) {
         return new ApiResponse<>(200, true, dailySafetyService.findLatest(lang));
    }
}
