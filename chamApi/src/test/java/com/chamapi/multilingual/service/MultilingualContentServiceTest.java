package com.chamapi.multilingual.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.multilingual.service.MultilingualContentService.Translated;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.chamapi.multilingual.service.MultilingualContentService.TYPE_DISASTER_MESSAGE;
import static org.assertj.core.api.Assertions.assertThat;

// MULTILINGUAL 을 동적 콘텐츠 번역 저장소로 쓰는 save/load 왕복 검증 (@Transactional 롤백)
@Transactional
class MultilingualContentServiceTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private MultilingualContentService contentService;

    @DisplayName("save 후 load — 저장한 언어별 (제목,내용)이 targetId 로 그룹핑돼 돌아온다")
    @Test
    void test1() {
        long targetId = 987_654_321L;
        Map<Language, Translated> byLanguage = new LinkedHashMap<>();
        byLanguage.put(Language.KO, new Translated("제목", "원문"));
        byLanguage.put(Language.EN, new Translated("Title", "origin text"));
        contentService.save(TYPE_DISASTER_MESSAGE, targetId, byLanguage);

        Map<Language, Translated> loaded =
                contentService.load(TYPE_DISASTER_MESSAGE, List.of(targetId), List.of(Language.EN, Language.KO))
                        .get(targetId);

        assertThat(loaded).hasSize(2);
        assertThat(loaded.get(Language.KO).title()).isEqualTo("제목");
        assertThat(loaded.get(Language.KO).cont()).isEqualTo("원문");
        assertThat(loaded.get(Language.EN).cont()).isEqualTo("origin text");
    }

    @DisplayName("load — 요청 언어 중 저장된 것만 반환 (없는 언어는 빠짐)")
    @Test
    void test2() {
        long targetId = 987_654_322L;
        contentService.save(TYPE_DISASTER_MESSAGE, targetId, Map.of(Language.KO, new Translated(null, "원문만")));

        Map<Language, Translated> loaded =
                contentService.load(TYPE_DISASTER_MESSAGE, List.of(targetId), List.of(Language.EN, Language.KO))
                        .getOrDefault(targetId, Map.of());

        assertThat(loaded).containsOnlyKeys(Language.KO);
    }

    @DisplayName("load — 여러 targetId 를 각 id 버킷으로 분리해 반환")
    @Test
    void test3() {
        long id1 = 987_654_331L;
        long id2 = 987_654_332L;
        contentService.save(TYPE_DISASTER_MESSAGE, id1, Map.of(Language.EN, new Translated(null, "first")));
        contentService.save(TYPE_DISASTER_MESSAGE, id2, Map.of(Language.EN, new Translated(null, "second")));

        Map<Long, Map<Language, Translated>> loaded =
                contentService.load(TYPE_DISASTER_MESSAGE, List.of(id1, id2), List.of(Language.EN));

        assertThat(loaded.get(id1).get(Language.EN).cont()).isEqualTo("first");
        assertThat(loaded.get(id2).get(Language.EN).cont()).isEqualTo("second");
    }
}
