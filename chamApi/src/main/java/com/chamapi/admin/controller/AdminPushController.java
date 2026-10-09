package com.chamapi.admin.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.push.dto.request.PushTokenRequest;
import com.chamapi.push.service.DisasterPushService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 관리자 푸시 테스트. 실제 재난문자가 없어도 기기 수신을 확인할 수 있게, 최신 재난문자를 지정한 토큰 하나에만 보낸다.
 * {@code /api/admin/**}라 {@code AdminAuthInterceptor}가 {@code X-Admin-Password}를 요구한다.
 */
@RestController
@RequestMapping("/api/admin/push")
@RequiredArgsConstructor
public class AdminPushController {

    private final DisasterPushService disasterPushService;

    @PostMapping("/test")
    public ApiResponse<Void> sendTest(@RequestBody PushTokenRequest request) {
        disasterPushService.sendTest(request.token());
        return ApiResponse.of(200, true, "발송 완료");
    }
}
