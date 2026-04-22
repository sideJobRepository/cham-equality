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
import com.chamapi.member.dto.MemberResponseDto;
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

/**
 * {@link RefreshTokenService} 구현체. RSA 서명 JWT + DB 저장형 refresh 조합.
 * 서명 키는 {@link RsaSecuritySigner}/{@link JWK}에서 주입(공개키는 파일, 비공개키는 DB).
 * 만료는 {@link AuthProperties}의 {@code refresh-token.expiry} 설정으로 결정된다.
 */
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

    /**
     * 멤버당 refresh row를 1개만 유지하기 위한 upsert.
     * 이미 존재하면 값·만료만 갱신하고(엔티티 메서드로 in-place update), 없으면 새로 insert한다.
     */
    private void saveOrUpdateInternal(Member member, String refreshTokenValue) {
        LocalDateTime expiresAt = LocalDateTime.now().plus(authProperties.getRefreshToken().getExpiry());
        RefreshToken token = refreshTokenRepository.findMember(member)
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


    /**
     * 토큰 재발급의 주 흐름: 유효성 검증 → 권한 조회 → 새 Access+Refresh 쌍 생성 → refresh row 갱신 → DTO 반환.
     * Refresh를 매번 회전시키므로 탈취된 이전 refresh는 곧바로 DB 불일치로 무효화된다.
     */
    @Override
    @Transactional
    public TokenAndUser reissueTokenWithUser(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new RefreshTokenExpiredException("리프레시 토큰이 없습니다.");
        }

        Member member = validateRefreshToken(refreshToken);

        // JWT의 roles 클레임은 접두사 없이 원본 roleName을 그대로 사용한다(JwtAuthenticationConverter와 계약).
        String roleName = memberRoleService
                .getMemberRole(member.getId())
                .getRole()
                .getRoleName();

        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(roleName));

        try {
            TokenPair token = rsaSecuritySigner.getToken(member, jwk, authorities);

            saveOrUpdateInternal(member, token.getRefreshToken());

            MemberResponseDto user = MemberResponseDto.create(member, authorities);

            return new TokenAndUser(token, user);
        } catch (JOSEException e) {
            throw new JwtGenerationException("JWT 생성 실패", e);
        }
    }

    /** 로그아웃. 매칭 row가 없으면 조용히 넘어가 "이미 로그아웃됨" 상황을 200으로 흡수. */
    @Override
    @Transactional
    public ApiResponse<Void> deleteRefresh(String request) {
        refreshTokenRepository.findRefreshTokenValue(request)
                .ifPresent(refreshTokenRepository::delete);
        return ApiResponse.of(200, true, "정상 삭제");
    }

    /**
     * Refresh 토큰의 DB 존재 + 만료 검사. 둘 중 하나라도 실패하면 {@link RefreshTokenExpiredException}.
     * 존재하지 않음과 만료됨의 메시지를 달리해 프론트/운영이 원인을 구분할 수 있게 한다.
     */
    @Override
    public Member validateRefreshToken(String refreshToken) {
        RefreshToken token = refreshTokenRepository
                .findRefreshTokenValue(refreshToken)
                .orElseThrow(() -> new RefreshTokenExpiredException("리프레시 토큰이 유효하지 않습니다."));

        if (token.getRefreshExpiresDate().isBefore(LocalDateTime.now())) {
            throw new RefreshTokenExpiredException("리프레시 토큰이 만료되었습니다.");
        }

        return token.getMember(); // fetch join 필요시 수정
    }
}
