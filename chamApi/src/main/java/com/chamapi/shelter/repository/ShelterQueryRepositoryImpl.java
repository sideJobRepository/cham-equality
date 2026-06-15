package com.chamapi.shelter.repository;

import com.chamapi.shelter.dto.query.ShelterSearchCondition;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.enums.ShelterType;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;

import static com.chamapi.shelter.entity.QPlace.*;
import static com.chamapi.shelter.entity.QRegion.*;
import static com.chamapi.shelter.entity.QShelter.*;
import static java.util.Objects.*;

@RequiredArgsConstructor
public class ShelterQueryRepositoryImpl implements ShelterQueryRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<Shelter> searchByCondition(ShelterSearchCondition condition) {
        return queryFactory
                .selectFrom(shelter)
                .leftJoin(shelter.place, place).fetchJoin()
                .leftJoin(place.region, region).fetchJoin()
                .where(shelterTypeAnyOf(condition.shelterTypes()))
                .fetch();
    }

    private BooleanExpression shelterTypeAnyOf(List<ShelterType> shelterTypes) {
        if (isNull(shelterTypes) || shelterTypes.isEmpty())
            return null;
        return shelter.shelterType.in(shelterTypes);
    }

}
