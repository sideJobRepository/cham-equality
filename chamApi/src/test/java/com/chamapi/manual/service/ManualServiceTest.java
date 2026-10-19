package com.chamapi.manual.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.manual.dto.ManualListResponse;
import com.chamapi.manual.entity.Manual;
import com.chamapi.manual.repository.ManualRepository;
import com.chamapi.multilingual.entity.Language;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class ManualServiceTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private ManualService manualService;

    @Autowired
    private ManualRepository manualRepository;

    @DisplayName("검색어가 본문 글자에 있으면 HTML 태그 사이에 있어도 검색된다")
    @Test
    void test1() {
        Manual manual = persistManual("화재 행동요령", "<p>젖은 <b>수건</b>으로 코와 입을 막으세요</p>");

        List<ManualListResponse> results = manualService.searchManuals(Language.KO, "수건");

        assertThat(savedIds(results, Set.of(manual.getId()))).containsExactly(manual.getId());
    }

    @DisplayName("검색어가 HTML 태그·속성에만 있으면 검색되지 않는다")
    @Test
    void test2() {
        Manual manual = persistManual("화재 행동요령", "<p style=\"color:red\"><img src=\"a.png\">대피하세요</p>");

        List<ManualListResponse> results = manualService.searchManuals(Language.KO, "style");

        assertThat(savedIds(results, Set.of(manual.getId()))).isEmpty();
    }

    @DisplayName("제목에만 검색어가 있어도 검색된다")
    @Test
    void test3() {
        Manual manual = persistManual("지진 행동요령", "<p>책상 아래로</p>");

        List<ManualListResponse> results = manualService.searchManuals(Language.KO, "지진");

        assertThat(savedIds(results, Set.of(manual.getId()))).containsExactly(manual.getId());
    }

    private Manual persistManual(String title, String content) {
        return manualRepository.saveAndFlush(Manual.builder()
                .language(Language.KO)
                .title(title)
                .content(content)
                .build());
    }

    private List<Long> savedIds(List<ManualListResponse> results, Set<Long> ids) {
        return results.stream()
                .map(ManualListResponse::id)
                .filter(ids::contains)
                .toList();
    }
}
