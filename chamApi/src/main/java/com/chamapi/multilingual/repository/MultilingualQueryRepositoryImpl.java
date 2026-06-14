package com.chamapi.multilingual.repository;

import com.chamapi.multilingual.entity.Language;
import com.chamapi.multilingual.entity.Multilingual;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;

import static com.chamapi.multilingual.entity.QMultilingual.*;
import static java.util.Objects.*;

@RequiredArgsConstructor
public class MultilingualQueryRepositoryImpl implements MultilingualQueryRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<Multilingual> search(String menu, Language language) {
        return queryFactory
                .selectFrom(multilingual)
                .where(
                        menuEq(menu),
                        languageEq(language)
                )
                .fetch();
    }

    private BooleanExpression menuEq(String menu) {
        if (isNull(menu) || menu.isBlank())
            return null;
        return multilingual.menu.eq(menu);
    }

    private BooleanExpression languageEq(Language language) {
        if (isNull(language))
            return null;
        return multilingual.language.eq(language);
    }

}
