package com.chamapi.authorization.service;


import com.chamapi.authorization.entity.MemberRole;

public interface MemberRoleService {
    MemberRole getMemberRole(Long memberId);

    /** 회원 탈퇴 시 그 회원의 권한 매핑 삭제. */
    void deleteByMember(Long memberId);
}
