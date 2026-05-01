package com.chamapi.shelter.auth;

import com.chamapi.common.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 시민 신고의 편집(수정) 권한을 확인하는 단순 비밀번호 검증기.
 * 익명 제출 구조라 별도 세션/JWT 없이 요청 헤더의 비밀번호만으로 본인성을 갈음한다.
 */
@Component
public class UserPasswordValidator {

    @Value("${app.report-user-password:}")
    private String userPassword;

    public void validate(String provided) {
        if (userPassword == null || userPassword.isEmpty()) {
            throw new UnauthorizedException("비밀번호 설정이 누락되었습니다");
        }
        if (!userPassword.equals(provided)) {
            throw new UnauthorizedException("비밀번호가 올바르지 않습니다");
        }
    }
}
