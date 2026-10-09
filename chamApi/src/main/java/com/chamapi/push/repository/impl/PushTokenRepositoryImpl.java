package com.chamapi.push.repository.impl;

import com.chamapi.push.entity.PushToken;
import com.chamapi.push.repository.query.PushTokenQueryRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.Collection;
import java.util.List;

import static com.chamapi.push.entity.QPushToken.pushToken;

@RequiredArgsConstructor
public class PushTokenRepositoryImpl implements PushTokenQueryRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<PushToken> findAllByValue(String value) {
        return queryFactory
                .selectFrom(pushToken)
                .where(pushToken.value.eq(value))
                .fetch();
    }

    @Override
    public void deleteAllByValueIn(Collection<String> values) {
        if (values.isEmpty()) return;
        queryFactory
                .delete(pushToken)
                .where(pushToken.value.in(values))
                .execute();
    }

    @Override
    public List<PushToken> findAllDisasterEnabled() {
        return queryFactory
                .selectFrom(pushToken)
                .where(pushToken.disasterEnabled.isTrue())
                .fetch();
    }

    @Override
    public List<PushToken> findAllPersonalEnabledByMemberId(Long memberId) {
        return queryFactory
                .selectFrom(pushToken)
                .where(pushToken.memberId.eq(memberId), pushToken.personalEnabled.isTrue())
                .fetch();
    }

    @Override
    public List<PushToken> findAllPersonalEnabledByMemberIds(Collection<Long> memberIds) {
        if (memberIds.isEmpty()) return List.of();
        return queryFactory
                .selectFrom(pushToken)
                .where(pushToken.memberId.in(memberIds), pushToken.personalEnabled.isTrue())
                .fetch();
    }
}
