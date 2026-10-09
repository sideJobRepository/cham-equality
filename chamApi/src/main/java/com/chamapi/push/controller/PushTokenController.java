package com.chamapi.push.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.push.dto.request.PushTokenRequest;
import com.chamapi.push.service.PushTokenService;
import com.chamapi.util.JwtParserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * 앱 기기의 푸시 토큰 등록/해제.
 *
 * <p><b>앱이 알아야 할 계약</b>
 * <ul>
 *   <li><b>JWT 선택.</b> 재난 알림은 비로그인 사용자에게도 가야 해서 토큰 없이도 받는다
 *       ({@code /api/app/**}는 {@code URL_RESOURCES} 미매핑이라 permitAll — 의도된 것).
 *       JWT가 있으면 기기를 그 회원에 연결해 관리자의 회원 지정 푸시 대상이 된다.</li>
 *   <li>앱 시작 시, FCM 토큰이 바뀔 때({@code onTokenRefresh}), <b>앱 언어를 바꾸거나 로그인·로그아웃할 때마다</b>
 *       다시 POST한다. 같은 토큰이면 회원·언어·활성 시각이 갱신된다(로그아웃 후엔 회원 연결이 끊김).</li>
 *   <li>{@code platform}은 android/ios, {@code language}는 ko/en/zh/ja/vi. 그 외 값은 400.</li>
 *   <li>알림 데이터 {@code type}은 재난문자면 {@code disaster}(+{@code messageId}), 관리자 개별 알림이면 {@code notice}.
 *       안드로이드 채널 id는 {@code disaster}다.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/app/push-tokens")
@RequiredArgsConstructor
public class PushTokenController {

    private final PushTokenService pushTokenService;

    @PostMapping
    public ApiResponse<Void> register(@RequestBody PushTokenRequest request, @AuthenticationPrincipal Jwt jwt) {
        pushTokenService.register(request, JwtParserUtil.extractMemberId(jwt));
        return ApiResponse.of(200, true, "등록 완료");
    }

    @DeleteMapping
    public ApiResponse<Void> unregister(@RequestBody PushTokenRequest request) {
        pushTokenService.unregister(request.token());
        return ApiResponse.of(200, true, "해제 완료");
    }
}
