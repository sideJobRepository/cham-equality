package com.chamapi.member.dto;

/**
 * 회원 탈퇴 요청 본문(선택). 애플 회원만 탈퇴 직전에 다시 받은 authorizationCode를 넣는다.
 * 본문 없이 보내는 기존 앱(카카오·네이버)도 그대로 동작한다.
 */
public record WithdrawRequest(String appleAuthorizationCode) {
}
