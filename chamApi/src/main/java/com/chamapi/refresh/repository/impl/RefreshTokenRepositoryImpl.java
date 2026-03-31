package com.chamapi.refresh.repository.impl;

import com.chamapi.member.entity.Member;
import com.chamapi.refresh.entity.RefreshToken;
import com.chamapi.refresh.repository.query.RefreshTokenQueryRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

import static com.chamapi.refresh.entity.QRefreshToken.refreshToken;


@RequiredArgsConstructor
public class RefreshTokenRepositoryImpl implements RefreshTokenQueryRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    
    @Override
    public Optional<RefreshToken> findPortfolioMember(Member member) {
        RefreshToken token = queryFactory
                .selectFrom(refreshToken)
                .where(refreshToken.member.eq(member))
                .fetchOne();
        return Optional.ofNullable(token);
    }
    
    @Override
    public Optional<RefreshToken> findPortfolioRefreshTokenValue(String refreshTokenValue) {
        RefreshToken tone = queryFactory
                .selectFrom(refreshToken)
                .where(refreshToken.refreshTokenValue.eq(refreshTokenValue))
                .fetchOne();
        return Optional.ofNullable(tone);
    }
    
    @Override
    public void deleteByMember(Long id) {
        em.flush();
        queryFactory
                .delete(refreshToken)
                .where(refreshToken.member.id.eq(id))
                .execute();
    }
}
