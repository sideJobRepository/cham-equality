package com.chamapi.multilingual.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.multilingual.service.MultilingualService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/multilingual")
@RequiredArgsConstructor
public class MultilingualController {

    private final MultilingualService multilingualService;

    @GetMapping
    public ApiResponse<?> getTexts(@RequestParam String menu, @RequestParam(required = false) String language) {
        if (language != null && !language.isBlank()) {
            Language target = Language.fromCode(language);
            return new ApiResponse<>(200, true, multilingualService.getTexts(menu, target));
        }
        return new ApiResponse<>(200, true, multilingualService.getAllTexts(menu));
    }

}
