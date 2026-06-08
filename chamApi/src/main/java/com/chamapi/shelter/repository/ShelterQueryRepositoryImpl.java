package com.chamapi.shelter.repository;

import com.chamapi.shelter.dto.query.ShelterSearchCondition;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.enums.AccessibilityFeature;
import com.chamapi.shelter.enums.ShelterType;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
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
                .where(Expressions.allOf(
                        shelterTypeAnyOf(condition.shelterTypes()),
                        accessibilityFeatureAnyOf(condition.accessibilityFeatures())
                ))
                .fetch();
    }

    private BooleanExpression shelterTypeAnyOf(List<ShelterType> shelterTypes) {
        if (isNull(shelterTypes) || shelterTypes.isEmpty())
            return null;
        return shelter.shelterType.in(shelterTypes);
    }

    private BooleanExpression accessibilityFeatureAnyOf(List<AccessibilityFeature> features) {
        if (isNull(features) || features.isEmpty()) {
            return null;
        }
        BooleanExpression predicate = null;
        for (AccessibilityFeature feature : features) {
            BooleanExpression expr = switch (feature) {
                case RAMP -> shelter.accessibility.ramp.isTrue();
                case ELEVATOR -> shelter.accessibility.elevator.isTrue();
                case BRAILLE_BLOCK -> shelter.accessibility.brailleBlock.isTrue();
            };
            predicate = (predicate == null) ? expr : predicate.or(expr);
        }
        return predicate;
    }

}
