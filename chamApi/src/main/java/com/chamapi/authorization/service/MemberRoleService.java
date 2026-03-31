package com.chamapi.authorization.service;


import com.chamapi.authorization.entity.MemberRole;

public interface MemberRoleService {
    MemberRole getMemberRole(Long memberId);
}
