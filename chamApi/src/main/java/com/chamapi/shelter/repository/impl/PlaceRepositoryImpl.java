package com.chamapi.shelter.repository.impl;

import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.repository.query.PlaceQueryRepository;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;

import static com.chamapi.shelter.entity.QPlace.place;

@RequiredArgsConstructor
public class PlaceRepositoryImpl implements PlaceQueryRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<Place> findBoundaryPending(int limit) {
        return queryFactory
                .selectFrom(place)
                .where(boundaryPending())
                .orderBy(place.id.asc())
                .limit(limit)
                .fetch();
    }

    @Override
    public long countBoundaryPending() {
        Long count = queryFactory
                .select(place.count())
                .from(place)
                .where(boundaryPending())
                .fetchOne();
        return count == null ? 0 : count;
    }

    private BooleanExpression boundaryPending() {
        return place.areaPnu.isNull()
                .and(place.latitude.isNotNull())
                .and(place.longitude.isNotNull());
    }
}
