package com.chamapi.multilingual.repository;

import com.chamapi.multilingual.entity.Language;
import com.chamapi.multilingual.entity.Multilingual;

import java.util.List;

public interface MultilingualQueryRepository {

    /** 특정 번역 타입에서 지정 타겟 ID·언어 행 일괄 조회. */
    List<Multilingual> findByTranslationTypeAndTargetIdsAndLanguages(String translationType, List<Long> targetIds, List<Language> languages);

}
