package com.chamapi.authentication.repository.impl;

import com.chamapi.member.entity.Member;
import com.chamapi.authentication.entity.RefreshToken;
import com.chamapi.authentication.repository.query.RefreshTokenQueryRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

import static com.chamapi.authentication.entity.QRefreshToken.refreshToken;


@RequiredArgsConstructor
public class RefreshTokenRepositoryImpl implements RefreshTokenQueryRepository {

    private final JPAQueryFactory queryFactory;
    
    @Override
    public Optional<RefreshToken> findMember(Member member) {
        RefreshToken token = queryFactory
                .selectFrom(refreshToken)
                .where(refreshToken.member.eq(member))
                .fetchOne();
        return Optional.ofNullable(token);
    }
    
    @Override
    public Optional<RefreshToken> findRefreshTokenValue(String refreshTokenValue) {
        RefreshToken tone = queryFactory
                .selectFrom(refreshToken)
                .where(refreshToken.refreshTokenValue.eq(refreshTokenValue))
                .fetchOne();
        return Optional.ofNullable(tone);
    }
}
