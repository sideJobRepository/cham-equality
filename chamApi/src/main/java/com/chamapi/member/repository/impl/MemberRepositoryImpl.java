package com.chamapi.member.repository.impl;

import com.chamapi.member.entity.Member;
import com.chamapi.member.repository.query.MemberQueryRepository;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static com.chamapi.member.entity.QMember.member;

@RequiredArgsConstructor
public class MemberRepositoryImpl implements MemberQueryRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<Member> searchByNameOrEmail(String keyword, Pageable pageable) {
        BooleanExpression condition = keywordMatches(keyword);
        List<Member> content = queryFactory
                .selectFrom(member)
                .where(condition)
                .orderBy(member.createDate.desc(), member.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
        Long total = queryFactory
                .select(member.count())
                .from(member)
                .where(condition)
                .fetchOne();
        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    private BooleanExpression keywordMatches(String keyword) {
        if (keyword == null || keyword.isBlank()) return null;
        String trimmed = keyword.trim();
        return member.memberName.contains(trimmed).or(member.email.contains(trimmed));
    }
}
