package com.chamapi.admin.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.manual.dto.ManualCreateRequest;
import com.chamapi.manual.dto.ManualListResponse;
import com.chamapi.manual.dto.ManualUpdateRequest;
import com.chamapi.admin.service.AdminManualService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/manuals")
@RequiredArgsConstructor
public class AdminManualController {

    private final AdminManualService adminManualService;

    @GetMapping
    public ApiResponse<List<ManualListResponse>> getManuals() {
        return ApiResponse.ok(adminManualService.getAllManuals());
    }

    @PostMapping
    public ApiResponse<Long> postManual(@RequestBody ManualCreateRequest request) {
        return ApiResponse.ok(adminManualService.createManual(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> putManual(@PathVariable Long id, @RequestBody ManualUpdateRequest request) {
        adminManualService.updateManual(id, request);
        return ApiResponse.ok();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteManual(@PathVariable Long id) {
        adminManualService.deleteManual(id);
        return ApiResponse.ok();
    }
}
