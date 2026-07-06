package com.chamapi.dailysafety.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.dailysafety.dto.DailySafetySummaryResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

// 실제 DB의 최신 일일 재난안전 요약을 언어별로 조회해 출력해보는 가벼운 스모크 테스트
class DailySafetyServiceTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private DailySafetyService dailySafetyService;

    @DisplayName("findLatest — 최신 요약을 ko/en 으로 조회 (출력 확인)")
    @Test
    void test1() {
        DailySafetySummaryResponse ko = dailySafetyService.findLatest("ko");
        DailySafetySummaryResponse en = dailySafetyService.findLatest("en");

        System.out.println("[ko] " + ko);
        System.out.println("[en] " + en);

        assertThat(ko).isNotNull();
        assertThat(en).isNotNull();
    }
}
