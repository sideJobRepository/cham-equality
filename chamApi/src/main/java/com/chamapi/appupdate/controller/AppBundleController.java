package com.chamapi.appupdate.controller;

import com.chamapi.appupdate.dto.response.AppBundleCheckResponse;
import com.chamapi.appupdate.service.AppBundleService;
import com.chamapi.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * JS 번들 OTA 업데이트 확인. 앱이 시작할 때(스플래시 동안) 부른다.
 *
 * <p><b>앱이 알아야 할 계약</b>
 * <ul>
 *   <li><b>인증 없음.</b> 비로그인 기기도 업데이트를 받아야 해서 {@code URL_RESOURCES} 미매핑(permitAll)이 의도다.</li>
 *   <li>{@code platform}=android/ios, {@code channel}=alpha/production(비우면 production),
 *       {@code fingerprint}=앱 네이티브 지문, {@code bundleId}=지금 돌고 있는 번들 id,
 *       {@code minBundleId}=앱 내장 번들 id. 전부 hot-updater 네이티브 모듈이 준다.</li>
 *   <li>받을 게 없으면 {@code data: null}. 있으면 {@link AppBundleCheckResponse}.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/app/bundles")
@RequiredArgsConstructor
public class AppBundleController {

    private final AppBundleService appBundleService;

    @GetMapping("/check")
    public ApiResponse<AppBundleCheckResponse> check(@RequestParam String platform,
                                                     @RequestParam(required = false) String channel,
                                                     @RequestParam String fingerprint,
                                                     @RequestParam String bundleId,
                                                     @RequestParam(required = false) String minBundleId) {
        return ApiResponse.ok(appBundleService.check(platform, channel, fingerprint, bundleId, minBundleId));
    }
}
