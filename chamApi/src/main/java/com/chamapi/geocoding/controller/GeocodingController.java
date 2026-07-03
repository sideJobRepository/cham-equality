package com.chamapi.geocoding.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.geocoding.service.GeocodingService;
import com.chamapi.multilingual.entity.Language;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/geocoding")
@RequiredArgsConstructor
public class GeocodingController {

    private final GeocodingService geocodingService;

    @GetMapping("/reverse")
    public ApiResponse<String> reverseGeocode(
            @RequestParam BigDecimal x,
            @RequestParam BigDecimal y,
            @RequestParam(defaultValue = "KO") Language lang) {
        return ApiResponse.ok(
                geocodingService.getAddressByCoord(y, x, lang));
    }

}
