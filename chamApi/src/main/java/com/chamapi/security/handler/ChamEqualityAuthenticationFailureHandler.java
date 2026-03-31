package com.chamapi.security.handler;


import com.chamapi.common.dto.ErrorMessageResponse;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
@Component("chamEqualityAuthenticationFailureHandler")
@RequiredArgsConstructor
public class ChamEqualityAuthenticationFailureHandler implements AuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException {
        JsonMapper mapper = JsonMapper.builder()
                .changeDefaultPropertyInclusion(handler ->
                        handler.withValueInclusion(JsonInclude.Include.NON_NULL)
                                .withContentInclusion(JsonInclude.Include.NON_NULL)
                )
                .build();
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json; charset=UTF-8");
        String message = (exception instanceof UsernameNotFoundException)
                ? "사용자 정보가 존재하지 않습니다."
                : "인증에 실패하였습니다.";
        
        ErrorMessageResponse errorResponse = new ErrorMessageResponse("400", message);
        mapper.writeValue(response.getWriter(), errorResponse);
    }
}
