package com.chamapi.authentication.service;



import com.chamapi.common.dto.ApiResponse;
import com.chamapi.member.entity.Member;
import com.chamapi.security.token.TokenAndUser;

/**
 * Refresh 토큰의 저장/검증/재발급/삭제 계약.
 * 한 멤버당 refresh row는 1개만 유지되며(새 값이 들어오면 기존 row를 업데이트),
 * 만료는 {@code auth.refresh-token.expiry} 설정으로 연장된다.
 */
public interface RefreshTokenService {

    /** 로그인 성공 직후 호출. 멤버 기존 row가 있으면 토큰 값을 교체하고 없으면 새로 만든다. */
    void refreshTokenSaveOrUpdate(Member member, String refreshTokenValue);

    /** 쿠키로 들어온 refresh 값이 DB와 일치하고 만료 전인지 확인한 뒤 소유 멤버를 반환. 실패 시 예외. */
    Member validateRefreshToken(String refreshToken);

    /** Refresh 회전 + Access 재발행. 응답용 사용자 DTO까지 묶어 돌려준다. */
    TokenAndUser reissueTokenWithUser(String refreshToken);

    /** 로그아웃. 해당 토큰 row가 있으면 삭제, 없으면 조용히 200. */
    ApiResponse<Void> deleteRefresh(String refreshToken);
}
