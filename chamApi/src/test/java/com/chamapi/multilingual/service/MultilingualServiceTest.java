package com.chamapi.multilingual.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.multilingual.dto.MultilingualBundleResponse;
import com.chamapi.multilingual.dto.MultilingualResponse;
import com.chamapi.multilingual.entity.Language;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

// DB에 시드된 실제 데이터(menu=home, menu=tab)를 읽기 전용으로 검증
@Transactional
class MultilingualServiceTest extends RepositoryAndServiceTestSupport {

    private static final String HOME = "home";
    private static final String TAB = "tab";

    @Autowired
    private MultilingualService multilingualService;

    @DisplayName("getTexts — 홈(ko): texts 는 화면 텍스트, tab 은 하단 탭 라벨로 디폴트 동봉")
    @Test
    void test1() {
        MultilingualResponse response = multilingualService.getTexts(HOME, Language.KO);

        assertThat(response.menu()).isEqualTo(HOME);
        assertThat(response.language()).isEqualTo("ko");
        assertThat(response.texts())
                .containsEntry("disasterMessage", "재난문자 영역")
                .containsEntry("dailySafetyStatus", "일일 재난안전관리 상황")
                .hasSize(2);
        assertThat(response.tab())
                .containsEntry("home", "홈")
                .containsEntry("map", "지도")
                .containsEntry("manual", "메뉴얼")
                .containsEntry("more", "더보기")
                .hasSize(4);
    }

    @DisplayName("getTexts — 홈(en) 한 번 요청으로 하단 탭 라벨 4개 + 홈 텍스트 2개를 모두 받아온다")
    @Test
    void test2() {
        MultilingualResponse response = multilingualService.getTexts(HOME, Language.EN);

        assertThat(response.menu()).isEqualTo(HOME);
        assertThat(response.language()).isEqualTo("en");

        // 화면(home) 텍스트 — 영어로 완전히 채워짐
        assertThat(response.texts())
                .containsOnly(
                        Map.entry("disasterMessage", "Emergency Alerts"),
                        Map.entry("dailySafetyStatus", "Daily Disaster Safety Status")
                );

        // 하단 탭 라벨 — 어느 화면 요청에도 디폴트 동봉, 영어로 4개 전부
        assertThat(response.tab())
                .containsOnly(
                        Map.entry("home", "Home"),
                        Map.entry("map", "Map"),
                        Map.entry("manual", "Manual"),
                        Map.entry("more", "More")
                );
    }

    @DisplayName("getTexts — tab 자체를 요청하면 texts 와 tab 이 동일한 탭 라벨")
    @Test
    void test3() {
        MultilingualResponse response = multilingualService.getTexts(TAB, Language.KO);

        assertThat(response.texts())
                .containsEntry("home", "홈")
                .containsEntry("map", "지도")
                .containsEntry("manual", "메뉴얼")
                .containsEntry("more", "더보기");
        assertThat(response.tab()).isEqualTo(response.texts());
    }

    @DisplayName("getAllTexts — 홈: texts/tab 모두 languageCode→(name→cont) 5개 언어 버킷")
    @Test
    void test4() {
        MultilingualBundleResponse response = multilingualService.getAllTexts(HOME);

        Map<String, Map<String, String>> texts = response.texts();
        assertThat(texts.keySet()).containsExactlyInAnyOrder("ko", "en", "zh", "ja", "vi");
        assertThat(texts.get("ko")).containsEntry("disasterMessage", "재난문자 영역");
        assertThat(texts.get("vi")).containsEntry("disasterMessage", "Tin nhắn khẩn cấp");

        Map<String, Map<String, String>> tab = response.tab();
        assertThat(tab.get("ko")).containsEntry("home", "홈");
        assertThat(tab.get("en")).containsEntry("manual", "Manual");
    }

    @DisplayName("getTexts — 존재하지 않는 menu 면 texts 는 비지만 tab 은 디폴트로 채워진다")
    @Test
    void test5() {
        MultilingualResponse response = multilingualService.getTexts("__no_such_menu__", Language.KO);

        assertThat(response.texts()).isEmpty();
        assertThat(response.tab()).containsEntry("home", "홈");
    }
}
