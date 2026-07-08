package com.chamapi.manual.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.manual.dto.ManualListResponse;
import com.chamapi.manual.dto.ManualResponse;
import com.chamapi.manual.service.ManualService;
import com.chamapi.multilingual.entity.Language;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manuals")
@RequiredArgsConstructor
public class ManualController {

    private final ManualService manualService;

    @GetMapping
    public ApiResponse<List<ManualListResponse>> getManuals(@RequestParam Language lang) {
        return ApiResponse.ok(manualService.getManuals(lang));
    }

    @GetMapping("/{id}")
    public ApiResponse<ManualResponse> getManual(@PathVariable Long id) {
        return ApiResponse.ok(manualService.getManual(id));
    }
}
