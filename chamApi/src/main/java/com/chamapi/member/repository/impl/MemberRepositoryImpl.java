package com.chamapi.member.repository.impl;

import com.chamapi.member.repository.query.MemberQueryRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class MemberRepositoryImpl implements MemberQueryRepository {
    
    private final JPAQueryFactory queryFactory;
}
