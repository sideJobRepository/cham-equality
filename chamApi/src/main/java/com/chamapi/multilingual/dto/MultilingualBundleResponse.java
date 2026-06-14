package com.chamapi.multilingual.dto;

import java.util.Map;

/**
 * 전체 언어 응답. tab/texts 모두 languageCode -> (name -> cont).
 * tab = 하단 탭 라벨(전역), texts = 요청 화면 텍스트.
 */
public record MultilingualBundleResponse(
        String menu,
        Map<String, Map<String, String>> tab,
        Map<String, Map<String, String>> texts
) {
}
