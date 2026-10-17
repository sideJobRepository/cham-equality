package com.chamapi.security.service;

/**
 * 애플 로그인 연결 해제(토큰 철회).
 * App Store 심사 5.1.1(v): 애플로 가입한 계정을 삭제할 때는 애플 쪽 토큰도 철회해야 한다.
 */
public interface AppleRevokeService {

    /**
     * 앱이 탈퇴 직전에 다시 받은 authorizationCode를 토큰으로 교환한 뒤 바로 철회한다.
     * 교환·철회 중 하나라도 실패하면 예외 — 호출 측은 탈퇴를 중단해야 한다.
     */
    void revokeByAuthorizationCode(String authorizationCode);
}
