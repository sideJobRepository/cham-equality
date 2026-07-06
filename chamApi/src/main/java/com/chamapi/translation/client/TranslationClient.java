package com.chamapi.translation.client;

import com.chamapi.multilingual.entity.Language;
import com.chamapi.translation.dto.DeepLRequest;
import com.chamapi.translation.dto.DeepLResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * DeepL 로 한국어 텍스트를 지정 언어들로 번역.
 * 대상 언어마다 1회씩 호출하며, text 배열은 순서를 보존해 그대로 번역돼 돌아온다.
 * 외부 API 장애는 언어 단위로 흡수 — 실패한 언어는 건너뛰고 성공분만 반환,
 * 전부 실패하면 빈 맵을 돌려 호출자(적재)가 원문(KO)만 저장하고 계속 진행하게 한다.
 */
@Component
@Slf4j
public class TranslationClient {

    private static final String TRANSLATE_PATH = "/v2/translate";
    private static final String SOURCE_LANG = "KO";

    // Language enum → DeepL target_lang 코드. KO 는 소스라 대상에서 제외됨.
    private static final Map<Language, String> TARGET_CODES = Map.of(
            Language.EN, "EN-US",
            Language.ZH, "ZH-HANS",
            Language.JA, "JA",
            Language.VI, "VI");

    private final RestClient restClient;

    public TranslationClient(@Qualifier("translationRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    /**
     * text 를 targets 각 언어로 번역. 키는 대상 언어, 값은 번역문.
     * 실패한 언어는 결과에서 빠지며, 전부 실패하면 빈 맵.
     */
    public Map<Language, String> translate(String text, List<Language> targets) {
        if (text == null || text.isBlank() || targets == null || targets.isEmpty()) {
            return Map.of();
        }

        Map<Language, String> result = new LinkedHashMap<>();
        for (Language language : targets) {
            List<String> translated = callDeepL(List.of(text), language);
            if (translated != null && !translated.isEmpty()) {
                String value = translated.getFirst();
                if (value != null && !value.isBlank()) {
                    result.put(language, value);
                }
            }
        }
        return result;
    }

    /**
     * texts(한국어 문장 리스트)를 targets 각 언어로 번역. 값은 입력과 같은 개수·순서의 리스트.
     * 입력과 개수가 다르게 오면 그 언어는 건너뛴다. 실패한 언어는 결과에서 빠지며, 전부 실패하면 빈 맵.
     */
    public Map<Language, List<String>> translateList(List<String> texts, List<Language> targets) {
        if (texts == null || texts.isEmpty() || targets == null || targets.isEmpty()) {
            return Map.of();
        }

        Map<Language, List<String>> result = new LinkedHashMap<>();
        for (Language language : targets) {
            List<String> translated = callDeepL(texts, language);
            if (translated != null && translated.size() == texts.size()) {
                result.put(language, translated);
            } else if (translated != null) {
                log.warn("deepl 리스트 번역 개수 불일치 language={} expected={} actual={}",
                        language, texts.size(), translated.size());
            }
        }
        return result;
    }

    /** text 배열을 target 언어로 번역. 번역문 리스트(입력과 같은 순서) 반환, 실패 시 null. */
    private List<String> callDeepL(List<String> text, Language target) {
        String targetCode = TARGET_CODES.get(target);
        if (targetCode == null) {
            log.warn("deepl 미지원 대상 언어 language={}", target);
            return null;
        }

        try {
            DeepLResponse response = restClient.post()
                    .uri(TRANSLATE_PATH)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new DeepLRequest(text, targetCode, SOURCE_LANG))
                    .retrieve()
                    .body(DeepLResponse.class);

            if (response == null || response.translations() == null || response.translations().isEmpty()) {
                log.warn("deepl 번역 응답이 비어있음 language={}", target);
                return null;
            }

            List<String> result = new ArrayList<>(response.translations().size());
            for (DeepLResponse.Translation translation : response.translations()) {
                result.add(translation.text());
            }
            return result;
        } catch (RestClientException e) {
            log.warn("deepl 번역 호출 실패 language={} message={}", target, e.getMessage());
            return null;
        }
    }
}
