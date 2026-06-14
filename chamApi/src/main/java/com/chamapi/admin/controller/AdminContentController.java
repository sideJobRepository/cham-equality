package com.chamapi.admin.controller;

import com.chamapi.admin.dto.request.AdminContentCreateRequest;
import com.chamapi.admin.dto.request.AdminContentUpdateRequest;
import com.chamapi.admin.service.AdminContentService;
import com.chamapi.common.dto.ApiResponse;
import com.chamapi.content.entity.Content;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/contents")
@RequiredArgsConstructor
public class AdminContentController {

    private final AdminContentService adminContentService;

    @GetMapping
    public ApiResponse<List<Content>> getAllContents() {
        return ApiResponse.ok(adminContentService.getAllContents());
    }

    @PostMapping
    public ApiResponse<Void> postContent(@RequestBody AdminContentCreateRequest request) {
        adminContentService.createContent(request);
        return ApiResponse.ok();
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> putContent(
            @RequestBody AdminContentUpdateRequest request,
            @PathVariable Long id
    ) {
        adminContentService.updateContent(id, request);
        return ApiResponse.ok();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteContent(@PathVariable Long id) {
        adminContentService.removeContent(id);
        return ApiResponse.ok();
    }

}
