package com.chamapi.multilingual.dto;

import java.util.Map;

/**
 * 단일 언어 응답. tab = 하단 탭 라벨(name→cont, 전역), texts = 요청 화면 텍스트(name→cont).
 */
public record MultilingualResponse(
        String menu,
        String language,
        Map<String, String> tab,
        Map<String, String> texts
) {
}
