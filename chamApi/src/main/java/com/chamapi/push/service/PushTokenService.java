package com.chamapi.push.service;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.push.dto.request.PushTokenRequest;
import com.chamapi.push.entity.PushToken;
import com.chamapi.push.enums.PushPlatform;
import com.chamapi.push.repository.PushTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * 기기 푸시 토큰 등록/해제. 무인증으로 열려 있는 API라 입력 검증이 유일한 방어선이다.
 * DB 컬럼이 전부 NULL 허용이라 필수값도 여기서 막는다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PushTokenService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final int TOKEN_MAX_LENGTH = 500;

    private final PushTokenRepository pushTokenRepository;

    /**
     * 같은 토큰이 있으면 회원·언어·플랫폼·활성 시각을 갱신하고, 없으면 새로 저장한다.
     * {@code memberId}는 요청 JWT에서 꺼낸 값이라 비로그인이면 null이다.
     */
    @Transactional
    public void register(PushTokenRequest request, Long memberId) {
        String token = validateToken(request.token());
        if (request.platform() == null || request.language() == null) {
            throw new BadRequestException("플랫폼과 언어는 필수입니다.");
        }
        PushPlatform platform = PushPlatform.from(request.platform());
        Language language = Language.fromCode(request.language());
        LocalDateTime now = LocalDateTime.now(KST);

        List<PushToken> existing = pushTokenRepository.findAllByValue(token);
        if (existing.isEmpty()) {
            pushTokenRepository.save(PushToken.builder()
                    .memberId(memberId)
                    .value(token)
                    .platform(platform)
                    .language(language)
                    .disasterEnabled(request.disasterEnabled())
                    .personalEnabled(request.personalEnabled())
                    .lastActiveDate(now)
                    .build());
            return;
        }
        existing.forEach(row -> row.refresh(memberId, platform, language,
                request.disasterEnabled(), request.personalEnabled(), now));
    }

    /** 알림 끄기·로그아웃 등으로 기기가 더는 받지 않겠다고 할 때. 없는 토큰이어도 성공으로 본다. */
    @Transactional
    public void unregister(String token) {
        pushTokenRepository.deleteAllByValueIn(List.of(validateToken(token)));
    }

    private String validateToken(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("토큰은 필수입니다.");
        }
        String trimmed = token.trim();
        if (trimmed.length() > TOKEN_MAX_LENGTH) {
            throw new BadRequestException("토큰이 너무 깁니다.");
        }
        return trimmed;
    }
}
