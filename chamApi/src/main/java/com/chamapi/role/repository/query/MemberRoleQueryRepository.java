package com.chamapi.role.repository.query;

import com.chamapi.role.entity.MemberRole;

import java.util.List;
import java.util.Optional;

public interface MemberRoleQueryRepository {
    
    Optional<MemberRole> findByMemberId(Long memberId);
    
    List<String> findByRoleName(Long id);

}
