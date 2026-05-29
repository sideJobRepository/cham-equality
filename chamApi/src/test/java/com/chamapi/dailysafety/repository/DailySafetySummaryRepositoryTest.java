package com.chamapi.dailysafety.repository;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.dailysafety.entity.DailySafetySummary;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class DailySafetySummaryRepositoryTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private DailySafetySummaryRepository repository;

    @Autowired
    private EntityManager em;

    @BeforeEach
    void cleanUp() {
        repository.deleteAllInBatch();
    }

    @DisplayName("findLatest — 데이터가 없으면 빈 Optional 반환")
    @Test
    void test1() {
        Optional<DailySafetySummary> result = repository.findLatest();

        assertThat(result).isEmpty();
    }

    @DisplayName("findLatest — 한 건만 있으면 해당 건을 반환")
    @Test
    void test2() {
        DailySafetySummary saved = repository.saveAndFlush(build("title-1"));

        Optional<DailySafetySummary> result = repository.findLatest();

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(saved.getId());
    }

    @DisplayName("findLatest — 여러 건이 있을 때 createDate가 가장 최근인 건을 반환")
    @Test
    void test3() {
        DailySafetySummary older = repository.saveAndFlush(build("title-older"));
        ReflectionTestUtils.setField(older, "createDate", LocalDateTime.now().minusHours(1));
        em.flush();

        DailySafetySummary newer = repository.saveAndFlush(build("title-newer"));

        Optional<DailySafetySummary> result = repository.findLatest();

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(newer.getId());
    }

    private DailySafetySummary build(String originTitle) {
        return DailySafetySummary.builder()
                .originTitle(originTitle)
                .originUrl("https://example.com/" + originTitle)
                .refinedHtml("<p>refined</p>")
                .summary(List.of("요약"))
                .build();
    }
}
