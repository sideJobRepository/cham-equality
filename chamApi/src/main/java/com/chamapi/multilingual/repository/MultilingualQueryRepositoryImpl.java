package com.chamapi.multilingual.repository;

import com.chamapi.multilingual.entity.Language;
import com.chamapi.multilingual.entity.Multilingual;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;

import static com.chamapi.multilingual.entity.QMultilingual.*;

@RequiredArgsConstructor
public class MultilingualQueryRepositoryImpl implements MultilingualQueryRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<Multilingual> findByTranslationTypeAndTargetIdsAndLanguages(String translationType, List<Long> targetIds, List<Language> languages) {
        if (targetIds.isEmpty() || languages.isEmpty()) {
            return List.of();
        }
        return queryFactory
                .selectFrom(multilingual)
                .where(
                        multilingual.translationType.eq(translationType),
                        multilingual.targetId.in(targetIds),
                        multilingual.language.in(languages)
                )
                .fetch();
    }
}
