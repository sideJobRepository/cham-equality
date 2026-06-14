package com.chamapi.multilingual.entity;

import com.chamapi.common.exception.BadRequestException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LanguageTest {

    @DisplayName("fromCode - 소문자 코드로 enum을 찾는다")
    @Test
    void fromCode_lowerCase_returnsEnum() {
        assertThat(Language.fromCode("ko")).isEqualTo(Language.KO);
        assertThat(Language.fromCode("en")).isEqualTo(Language.EN);
        assertThat(Language.fromCode("zh")).isEqualTo(Language.ZH);
        assertThat(Language.fromCode("ja")).isEqualTo(Language.JA);
        assertThat(Language.fromCode("vi")).isEqualTo(Language.VI);
    }

    @DisplayName("fromCode - 대소문자를 구분하지 않는다")
    @Test
    void fromCode_ignoresCase() {
        assertThat(Language.fromCode("EN")).isEqualTo(Language.EN);
        assertThat(Language.fromCode("Ko")).isEqualTo(Language.KO);
    }

    @DisplayName("fromCode - 지원하지 않는 코드면 BadRequestException 을 던진다")
    @Test
    void fromCode_unsupported_throws() {
        assertThatThrownBy(() -> Language.fromCode("xx"))
                .isInstanceOf(BadRequestException.class);
    }

    @DisplayName("getCode - 각 상수는 소문자 코드를 반환한다")
    @Test
    void getCode_returnsLowerCaseCode() {
        assertThat(Language.KO.getCode()).isEqualTo("ko");
        assertThat(Language.EN.getCode()).isEqualTo("en");
        assertThat(Language.ZH.getCode()).isEqualTo("zh");
        assertThat(Language.JA.getCode()).isEqualTo("ja");
        assertThat(Language.VI.getCode()).isEqualTo("vi");
    }
}
