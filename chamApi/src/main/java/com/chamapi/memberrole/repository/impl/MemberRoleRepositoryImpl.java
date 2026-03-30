package com.chamapi.memberrole.repository.impl;

import com.chamapi.memberrole.entity.MemberRole;
import com.chamapi.memberrole.repository.query.MemberRoleQueryRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

import static com.chamapi.member.entrity.QMember.member;
import static com.chamapi.memberrole.entity.QMemberRole.memberRole;
import static com.chamapi.role.entity.QRole.role;


@RequiredArgsConstructor
public class MemberRoleRepositoryImpl implements MemberRoleQueryRepository {
    
    private final JPAQueryFactory queryFactory;
    
    @Override
    public Optional<MemberRole> findByMemberId(Long memberId) {
        MemberRole result = queryFactory
                .selectFrom(memberRole)
                .join(memberRole.member, member)
                .where(member.id.eq(memberId))
                .fetchFirst();
        return Optional.ofNullable(result);
    }
    
    @Override
    public List<String> findByRoleName(Long id) {
        return queryFactory
                .select(role.roleName)
                .from(memberRole)
                .join(memberRole.member, member)
                .join(memberRole.role, role)
                .where(memberRole.member.id.eq(id))
                .fetch();
    }
}
