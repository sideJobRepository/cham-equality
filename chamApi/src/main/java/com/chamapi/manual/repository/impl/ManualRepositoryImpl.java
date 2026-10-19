package com.chamapi.manual.repository.impl;

import com.chamapi.manual.entity.Manual;
import com.chamapi.manual.repository.query.ManualQueryRepository;
import com.chamapi.multilingual.entity.Language;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;

import static com.chamapi.manual.entity.QManual.manual;

@RequiredArgsConstructor
public class ManualRepositoryImpl implements ManualQueryRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<Manual> searchByTitleOrContent(Language language, String query) {
        return queryFactory
                .selectFrom(manual)
                .where(
                        manual.language.eq(language),
                        manual.title.containsIgnoreCase(query)
                                .or(manual.content.containsIgnoreCase(query))
                )
                .fetch();
    }
}
