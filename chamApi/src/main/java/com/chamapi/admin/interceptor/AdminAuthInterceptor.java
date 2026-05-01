package com.chamapi.admin.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    private static final String HEADER_NAME = "X-Admin-Password";

    @Value("${app.admin-password:}")
    private String adminPassword;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (adminPassword == null || adminPassword.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            return false;
        }
        String provided = request.getHeader(HEADER_NAME);
        if (!adminPassword.equals(provided)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
        return true;
    }
}
