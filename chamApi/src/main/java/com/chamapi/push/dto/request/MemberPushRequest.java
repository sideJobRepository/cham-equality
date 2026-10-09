package com.chamapi.push.dto.request;

/** 관리자가 특정 회원에게 보내는 알림. 제목·내용 모두 필수. */
public record MemberPushRequest(
        String title,
        String body
) {
}
