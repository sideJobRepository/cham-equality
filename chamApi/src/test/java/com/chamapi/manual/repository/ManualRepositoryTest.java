package com.chamapi.manual.repository;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.manual.entity.Manual;
import com.chamapi.multilingual.entity.Language;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class ManualRepositoryTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private ManualRepository manualRepository;

    @Autowired
    private EntityManager em;

    @DisplayName("searchByTitle - 제목 중간에 검색어가 포함되면 반환된다")
    @Test
    void searchByTitle_partialMatch_returnsManual() {
        Manual manual = persistManual(Language.KO, "지진 발생 시 행동요령", "본문");
        flushAndClear();

        List<Manual> results = manualRepository.searchByTitle(Language.KO, "발생");

        assertThat(filterSaved(results, Set.of(manual.getId())))
                .containsExactly(manual.getId());
    }

    @DisplayName("searchByTitle - 제목이 일치해도 언어가 다르면 제외된다")
    @Test
    void searchByTitle_otherLanguage_isExcluded() {
        Manual ko = persistManual(Language.KO, "지진 행동요령", "본문");
        Manual en = persistManual(Language.EN, "지진 행동요령", "content");
        flushAndClear();

        List<Manual> results = manualRepository.searchByTitle(Language.KO, "지진");

        assertThat(filterSaved(results, Set.of(ko.getId(), en.getId())))
                .containsExactly(ko.getId());
    }

    @DisplayName("searchByTitle - 대소문자가 달라도 매칭된다")
    @Test
    void searchByTitle_ignoresCase() {
        Manual manual = persistManual(Language.EN, "Earthquake Manual", "content");
        flushAndClear();

        List<Manual> results = manualRepository.searchByTitle(Language.EN, "eArThQuAkE");

        assertThat(filterSaved(results, Set.of(manual.getId())))
                .containsExactly(manual.getId());
    }

    @DisplayName("searchByTitle - 제목에 일치하는 검색어가 없으면 빈 결과가 반환된다")
    @Test
    void searchByTitle_noMatch_returnsEmpty() {
        Manual manual = persistManual(Language.KO, "지진 행동요령", "본문");
        flushAndClear();

        List<Manual> results = manualRepository.searchByTitle(Language.KO, "화재");

        assertThat(filterSaved(results, Set.of(manual.getId()))).isEmpty();
    }

    @DisplayName("searchByTitle - 검색어에 매칭되는 매뉴얼이 여러 건이면 모두 반환된다")
    @Test
    void searchByTitle_multipleMatches_returnsAll() {
        Manual first = persistManual(Language.KO, "지진 행동요령", "본문");
        Manual second = persistManual(Language.KO, "지진 대피소 이용 안내", "본문");
        flushAndClear();

        List<Manual> results = manualRepository.searchByTitle(Language.KO, "지진");

        assertThat(filterSaved(results, Set.of(first.getId(), second.getId())))
                .containsExactlyInAnyOrder(first.getId(), second.getId());
    }

    @DisplayName("searchByTitle - 본문에만 포함된 단어로는 검색되지 않는다")
    @Test
    void searchByTitle_contentOnlyKeyword_isNotMatched() {
        Manual manual = persistManual(Language.KO, "지진 행동요령", "책상 아래로 대피하세요");
        flushAndClear();

        List<Manual> results = manualRepository.searchByTitle(Language.KO, "책상");

        assertThat(filterSaved(results, Set.of(manual.getId()))).isEmpty();
    }

    @DisplayName("searchByTitle - 검색어가 빈 문자열이면 해당 언어의 매뉴얼이 전체 반환된다")
    @Test
    void searchByTitle_emptyQuery_returnsAllOfLanguage() {
        Manual ko1 = persistManual(Language.KO, "지진 행동요령", "본문");
        Manual ko2 = persistManual(Language.KO, "화재 행동요령", "본문");
        Manual en = persistManual(Language.EN, "Fire Manual", "content");
        flushAndClear();

        List<Manual> results = manualRepository.searchByTitle(Language.KO, "");

        assertThat(filterSaved(results, Set.of(ko1.getId(), ko2.getId(), en.getId())))
                .containsExactlyInAnyOrder(ko1.getId(), ko2.getId());
    }

    private Manual persistManual(Language language, String title, String content) {
        return manualRepository.save(Manual.builder()
                .language(language)
                .title(title)
                .content(content)
                .build());
    }

    private List<Long> filterSaved(List<Manual> results, Set<Long> savedIds) {
        return results.stream()
                .map(Manual::getId)
                .filter(savedIds::contains)
                .toList();
    }

    private void flushAndClear() {
        em.flush();
        em.clear();
    }
}
