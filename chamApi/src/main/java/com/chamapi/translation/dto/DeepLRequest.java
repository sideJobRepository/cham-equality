package com.chamapi.translation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * DeepL v2/translate 요청 바디.
 * text 는 번역할 문장 배열(최대 50개), 응답은 같은 개수·순서로 돌아온다.
 */
public record DeepLRequest(
        List<String> text,
        @JsonProperty("target_lang") String targetLang,
        @JsonProperty("source_lang") String sourceLang) {
}
