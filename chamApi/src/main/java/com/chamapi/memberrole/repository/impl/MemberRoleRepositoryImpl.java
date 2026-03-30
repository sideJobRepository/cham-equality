package com.chamapi.memberrole.repository.impl;

import com.chamapi.memberrole.entity.MemberRole;
import com.chamapi.memberrole.repository.query.MemberRoleQueryRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

import static com.chamapi.member.entrity.QMember.member;
import static com.chamapi.memberrole.entity.QMemberRole.memberRole;


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
}
