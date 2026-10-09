package com.chamapi.push.dto.response;

import com.chamapi.member.entity.Member;
import com.chamapi.member.enums.SocialType;

import java.time.LocalDateTime;

/** 관리자 회원 목록 한 줄. {@code pushDeviceCount}가 0이면 푸시를 보낼 수 없다(앱 미설치·로그아웃·알림 미등록). */
public record AdminMemberResponse(
        Long id,
        String name,
        String email,
        SocialType socialType,
        LocalDateTime createDate,
        int pushDeviceCount
) {
    public static AdminMemberResponse of(Member member, int pushDeviceCount) {
        return new AdminMemberResponse(
                member.getId(),
                member.getMemberName(),
                member.getEmail(),
                member.getSocialType(),
                member.getCreateDate(),
                pushDeviceCount);
    }
}
