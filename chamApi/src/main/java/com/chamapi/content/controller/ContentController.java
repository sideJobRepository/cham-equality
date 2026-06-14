package com.chamapi.content.controller;


import com.chamapi.common.dto.ApiResponse;
import com.chamapi.content.entity.Content;
import com.chamapi.content.service.ContentService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController("/api/contents")
@AllArgsConstructor
public class ContentController {

    private final ContentService contentService;

    @GetMapping("/")
    public ApiResponse<List<Content>> getContents(){
        List<Content> contents = contentService.getAllDisplayableContents();
        return ApiResponse.ok(contents);
    }

}
