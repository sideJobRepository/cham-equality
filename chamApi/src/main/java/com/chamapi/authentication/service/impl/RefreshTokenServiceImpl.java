package com.chamapi.authentication.service.impl;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.member.entity.Member;
import com.chamapi.authorization.service.MemberRoleService;
import com.chamapi.authentication.config.AuthProperties;
import com.chamapi.authentication.entity.RefreshToken;
import com.chamapi.authentication.exception.JwtGenerationException;
import com.chamapi.authentication.exception.RefreshTokenExpiredException;
import com.chamapi.authentication.repository.RefreshTokenRepository;
import com.chamapi.authentication.service.RefreshTokenService;
import com.chamapi.security.dto.MemberResponseDto;
import com.chamapi.security.token.TokenAndUser;
import com.chamapi.security.token.TokenPair;
import com.chamapi.security.jwt.RsaSecuritySigner;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.JWK;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {
    
    private final RefreshTokenRepository refreshTokenRepository;
    private final MemberRoleService memberRoleService;
    private final RsaSecuritySigner rsaSecuritySigner;
    private final JWK jwk;
    private final AuthProperties authProperties;
    
    @Override
    @Transactional
    public void refreshTokenSaveOrUpdate(Member member, String refreshTokenValue) {
        saveOrUpdateInternal(member, refreshTokenValue);
    }

    private void saveOrUpdateInternal(Member member, String refreshTokenValue) {
        LocalDateTime expiresAt = LocalDateTime.now().plus(authProperties.getRefreshToken().getExpiry());
        RefreshToken token = refreshTokenRepository.findPortfolioMember(member)
                .map(existing -> {
                    existing.updateToken(refreshTokenValue, expiresAt);
                    return existing;
                })
                .orElseGet(() -> RefreshToken.builder()
                        .member(member)
                        .refreshTokenValue(refreshTokenValue)
                        .refreshExpiresDate(expiresAt)
                        .build()
                );
        refreshTokenRepository.save(token);
    }
    
    
    @Override
    @Transactional
    public TokenAndUser reissueTokenWithUser(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new RefreshTokenExpiredException("리프레시 토큰이 없습니다.");
        }

        Member member = validateRefreshToken(refreshToken);

        String roleName = memberRoleService
                .getMemberRole(member.getId())
                .getRole()
                .getRoleName();
        
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(roleName));
        
        try {
            TokenPair token = rsaSecuritySigner.getToken(member, jwk, authorities);
            
            saveOrUpdateInternal(member, token.getRefreshToken());
            
            // 로그인 때와 동일하게 DTO 생성
            MemberResponseDto user = MemberResponseDto.create(member, authorities);
            
            return new TokenAndUser(token, user);
        } catch (JOSEException e) {
            throw new JwtGenerationException("JWT 생성 실패", e);
        }
    }
    
    @Override
    @Transactional
    public ApiResponse<Void> deleteRefresh(String request) {
        refreshTokenRepository.findPortfolioRefreshTokenValue(request)
                .ifPresent(refreshTokenRepository::delete);
        return ApiResponse.of(200, true, "정상 삭제");
    }
    
    @Override
    public Member validateRefreshToken(String refreshToken) {
        RefreshToken token = refreshTokenRepository
                .findPortfolioRefreshTokenValue(refreshToken)
                .orElseThrow(() -> new RefreshTokenExpiredException("리프레시 토큰이 유효하지 않습니다."));

        if (token.getRefreshExpiresDate().isBefore(LocalDateTime.now())) {
            throw new RefreshTokenExpiredException("리프레시 토큰이 만료되었습니다.");
        }

        return token.getMember(); // fetch join 필요시 수정
    }
}
