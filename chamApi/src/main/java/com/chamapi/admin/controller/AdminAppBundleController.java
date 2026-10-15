package com.chamapi.admin.controller;

import com.chamapi.appupdate.dto.request.AppBundleCreateRequest;
import com.chamapi.appupdate.dto.response.AppBundleResponse;
import com.chamapi.appupdate.service.AppBundleService;
import com.chamapi.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * JS 번들 OTA 관리. GitHub Actions가 부른다(CI 번들 등록, promote-ota 워크플로의 승격·끄기·켜기).
 * {@code /api/admin/**}라 {@code AdminAuthInterceptor}가 {@code X-Admin-Password}를 요구한다.
 */
@RestController
@RequestMapping("/api/admin/app-bundles")
@RequiredArgsConstructor
public class AdminAppBundleController {

    private final AppBundleService appBundleService;

    @GetMapping
    public ApiResponse<List<AppBundleResponse>> findRecent(@RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.ok(appBundleService.findRecent(limit));
    }

    @PostMapping
    public ApiResponse<AppBundleResponse> register(@RequestBody AppBundleCreateRequest request) {
        return ApiResponse.ok(appBundleService.register(request));
    }

    /** 테스터에게만 가던 번들을 전부 전체 사용자에게. */
    @PostMapping("/promote")
    public ApiResponse<List<AppBundleResponse>> promoteAll() {
        return ApiResponse.ok(appBundleService.promoteAll());
    }

    @PostMapping("/{uuid}/disable")
    public ApiResponse<AppBundleResponse> disable(@PathVariable String uuid) {
        return ApiResponse.ok(appBundleService.changeEnabled(uuid, false));
    }

    @PostMapping("/{uuid}/enable")
    public ApiResponse<AppBundleResponse> enable(@PathVariable String uuid) {
        return ApiResponse.ok(appBundleService.changeEnabled(uuid, true));
    }
}
