package com.chamapi.member.service;

public interface MemberService {

    /**
     * 회원 탈퇴(계정삭제). 그 회원의 앱 제보(미승인 사진 정리, 승인 데이터는 유지) + 권한 매핑 +
     * refresh 토큰 + 회원 본인을 한 트랜잭션에서 삭제한다.
     * 애플 회원이면 삭제 전에 애플 토큰을 철회하며, 그래서 {@code appleAuthorizationCode}가 필요하다.
     */
    void withdraw(Long memberId, String appleAuthorizationCode);
}
