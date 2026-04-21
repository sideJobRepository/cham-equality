package com.chamapi.shelter.auth;

import com.chamapi.common.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class UserPasswordValidator {

    public static final String HEADER_NAME = "X-User-Password";

    @Value("${user.password:}")
    private String userPassword;

    public void validate(String provided) {
        if (userPassword == null || userPassword.isEmpty()) {
            throw new UnauthorizedException("비밀번호 설정이 누락되었습니다");
        }
        if (provided == null || !userPassword.equals(provided)) {
            throw new UnauthorizedException("비밀번호가 올바르지 않습니다");
        }
    }
}
