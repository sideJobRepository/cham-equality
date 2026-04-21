package com.chamapi.admin.controller;

import com.chamapi.admin.dto.request.AdminLoginRequest;
import com.chamapi.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminAuthController {

    @Value("${admin.password:}")
    private String adminPassword;

    @PostMapping("/login")
    public ApiResponse<Boolean> login(@RequestBody AdminLoginRequest request) {
        boolean ok = adminPassword != null
                && !adminPassword.isEmpty()
                && adminPassword.equals(request.password());
        return new ApiResponse<>(ok ? 200 : 401, ok, ok);
    }
}
