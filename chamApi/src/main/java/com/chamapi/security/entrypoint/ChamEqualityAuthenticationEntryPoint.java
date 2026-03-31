package com.chamapi.security.entrypoint;


import com.chamapi.common.dto.ErrorMessageResponse;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;


@Component(value = "chamEqualityAuthenticationEntryPoint")
@RequiredArgsConstructor
public class ChamEqualityAuthenticationEntryPoint implements AuthenticationEntryPoint {
    
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
        JsonMapper mapper = JsonMapper.builder()
                .changeDefaultPropertyInclusion(handler ->
                        handler.withValueInclusion(JsonInclude.Include.NON_NULL)
                                .withContentInclusion(JsonInclude.Include.NON_NULL)
                )
                .build();
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(mapper.writeValueAsString(
                new ErrorMessageResponse("401", "로그인 정보가 존재하지 않습니다.")));
    }
}
