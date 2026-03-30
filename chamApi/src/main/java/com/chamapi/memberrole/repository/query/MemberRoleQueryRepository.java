package com.chamapi.memberrole.repository.query;

import com.chamapi.memberrole.entity.MemberRole;

import java.util.Optional;

public interface MemberRoleQueryRepository {
    
    Optional<MemberRole> findByMemberId(Long memberId);
    

}
