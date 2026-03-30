package com.chamapi.security.repository;


import com.chamapi.role.entity.Role;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;



@Repository
@RequiredArgsConstructor
public class MemberDetailRepositoryImpl {
    
    
    private final JPAQueryFactory queryFactory;
    
    
    public Role findByRoleName(String roleName) {
//         return queryFactory
//                .selectFrom(bgmAgitRole)
//                .where(bgmAgitRole.bgmAgitRoleName.eq(roleName))
//                .fetchOne();
        return null;
    }
    
    public List<String> getRoleName(Long id){
//        return queryFactory
//                .select(bgmAgitRole.bgmAgitRoleName)
//                .from(bgmAgitMemberRole)
//                .join(bgmAgitMemberRole.bgmAgitMember,bgmAgitMember)
//                .join(bgmAgitMemberRole.bgmAgitRole , bgmAgitRole)
//                .where(bgmAgitMemberRole.bgmAgitMember.bgmAgitMemberId.eq(id))
//                .fetch();
        return null;
    }
    
}
