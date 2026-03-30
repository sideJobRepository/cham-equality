package com.chamapi.refresh.service;



import com.chamapi.dto.ApiResponse;
import com.chamapi.member.entrity.Member;
import com.chamapi.security.dto.TokenAndUser;

import java.time.LocalDateTime;

public interface RefreshTokenService {
    
    void refreshTokenSaveOrUpdate(Member member, String refreshTokenValue, LocalDateTime expiresAt);
    Member validateRefreshToken(String refreshToken);
    TokenAndUser reissueTokenWithUser(String refreshToken); // ← 이름/시그니처 통일
    ApiResponse deleteRefresh(String refreshToken);
}
