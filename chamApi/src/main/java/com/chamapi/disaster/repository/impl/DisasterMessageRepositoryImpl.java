package com.chamapi.disaster.repository.impl;

import com.chamapi.disaster.entity.DisasterMessage;
import com.chamapi.disaster.enums.EmergencyStep;
import com.chamapi.disaster.repository.query.DisasterMessageQueryRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.chamapi.disaster.entity.QDisasterMessage.disasterMessage;

@RequiredArgsConstructor
public class DisasterMessageRepositoryImpl implements DisasterMessageQueryRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public Set<Long> findExistingSns(List<Long> sns) {
        List<Long> result = queryFactory
                .select(disasterMessage.sn)
                .from(disasterMessage)
                .where(disasterMessage.sn.in(sns))
                .fetch();
        return new HashSet<>(result);
    }

    @Override
    public List<DisasterMessage> findActive(String region, List<EmergencyStep> steps, LocalDateTime since) {
        return queryFactory
                .selectFrom(disasterMessage)
                .where(
                        disasterMessage.regionName.contains(region),
                        disasterMessage.emergencyStep.in(steps),
                        disasterMessage.issuedAt.goe(since)
                )
                .orderBy(disasterMessage.issuedAt.desc())
                .fetch();
    }
}
