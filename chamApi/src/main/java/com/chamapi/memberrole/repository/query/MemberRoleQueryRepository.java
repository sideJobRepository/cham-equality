package com.chamapi.memberrole.repository.query;

import com.chamapi.memberrole.entity.MemberRole;

import java.util.List;
import java.util.Optional;

public interface MemberRoleQueryRepository {
    
    Optional<MemberRole> findByMemberId(Long memberId);
    
    List<String> findByRoleName(Long id);

}
