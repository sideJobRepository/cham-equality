package com.chamapi.admin.controller;

import com.chamapi.admin.dto.request.AdminLoginRequest;
import com.chamapi.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 비밀번호 확인용 로그인 API.
 * 현재 관리자는 1인 운영 체계라 계정/세션을 두지 않고 환경변수 비밀번호와 직접 비교한다.
 * 이후 요청은 프론트가 매번 {@code X-Admin-Password} 헤더로 같은 비밀번호를 실어 인가를 통과시킨다.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminAuthController {

    @Value("${admin.password:}")
    private String adminPassword;

    /** 비밀번호 일치 여부만 반환. 실패 시에도 예외 대신 401 코드를 응답 본문에 실어 프론트에서 단순 분기. */
    @PostMapping("/login")
    public ApiResponse<Boolean> login(@RequestBody AdminLoginRequest request) {
        boolean ok = adminPassword != null
                && !adminPassword.isEmpty()
                && adminPassword.equals(request.password());
        return new ApiResponse<>(ok ? 200 : 401, ok, ok);
    }
}
