package com.chamapi.translation.dto;

import java.util.List;

/**
 * DeepL v2/translate 응답. translations 는 요청 text 와 같은 개수·순서.
 * 알 수 없는 필드(detected_source_language 등)는 Jackson 기본 설정으로 무시.
 */
public record DeepLResponse(List<Translation> translations) {

    public record Translation(String text) {}
}
