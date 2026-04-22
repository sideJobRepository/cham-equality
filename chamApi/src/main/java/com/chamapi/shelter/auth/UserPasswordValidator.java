package com.chamapi.shelter.auth;

import com.chamapi.common.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 시민 신고의 편집(수정) 권한을 확인하는 단순 비밀번호 검증기.
 * 익명 제출 구조라 별도 세션/JWT 없이 요청 헤더의 비밀번호만으로 본인성을 갈음한다.
 * 정답 비밀번호는 환경변수 {@code USER_PASSWORD}에서 주입된다.
 */
@Component
public class UserPasswordValidator {

    /** 프론트가 수정 요청에 실어 보내는 헤더. 프론트 코드와 이름을 맞춰야 하므로 상수로 공유. */
    public static final String HEADER_NAME = "X-User-Password";

    @Value("${user.password:}")
    private String userPassword;

    public void validate(String provided) {
        // 서버 측 설정 누락과 사용자 입력 오류는 같은 401이지만 메시지를 달리해 운영 진단을 돕는다.
        if (userPassword == null || userPassword.isEmpty()) {
            throw new UnauthorizedException("비밀번호 설정이 누락되었습니다");
        }
        if (provided == null || !userPassword.equals(provided)) {
            throw new UnauthorizedException("비밀번호가 올바르지 않습니다");
        }
    }
}
