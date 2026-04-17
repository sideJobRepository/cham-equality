package com.chamapi.authentication.service;



import com.chamapi.common.dto.ApiResponse;
import com.chamapi.member.entity.Member;
import com.chamapi.security.token.TokenAndUser;

public interface RefreshTokenService {

    void refreshTokenSaveOrUpdate(Member member, String refreshTokenValue);
    Member validateRefreshToken(String refreshToken);
    TokenAndUser reissueTokenWithUser(String refreshToken); // ← 이름/시그니처 통일
    ApiResponse<Void> deleteRefresh(String refreshToken);
}
