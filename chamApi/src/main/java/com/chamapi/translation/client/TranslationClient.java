package com.chamapi.translation.client;

import com.chamapi.multilingual.entity.Language;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.translate.TranslateClient;
import software.amazon.awssdk.services.translate.model.TranslateTextRequest;
import software.amazon.awssdk.services.translate.model.TranslateTextResponse;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Amazon Translate 로 한국어 텍스트를 지정 언어들로 번역.
 * 대상 언어·문장마다 translateText 를 호출하며, 실패는 언어 단위로 흡수한다.
 * 실패한 언어는 건너뛰고 성공분만 반환, 전부 실패하면 빈 맵을 돌려
 * 호출자(적재)가 원문(KO)만 저장하고 계속 진행하게 한다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TranslationClient {

    private static final String SOURCE_LANG = "ko";

    // Language enum → Amazon Translate 언어 코드. KO 는 소스라 대상에서 제외됨.
    private static final Map<Language, String> TARGET_CODES = Map.of(
            Language.EN, "en",
            Language.ZH, "zh",
            Language.JA, "ja",
            Language.VI, "vi");

    private final TranslateClient translateClient;

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
            String translated = translateOne(text, language);
            if (translated != null && !translated.isBlank()) {
                result.put(language, translated);
            }
        }
        return result;
    }

    /**
     * texts(한국어 문장 리스트)를 targets 각 언어로 번역. 값은 입력과 같은 개수·순서의 리스트.
     * 한 언어에서 한 문장이라도 실패하면 그 언어는 통째로 건너뛴다(개수 일치 보장).
     * 실패한 언어는 결과에서 빠지며, 전부 실패하면 빈 맵.
     */
    public Map<Language, List<String>> translateList(List<String> texts, List<Language> targets) {
        if (texts == null || texts.isEmpty() || targets == null || targets.isEmpty()) {
            return Map.of();
        }

        Map<Language, List<String>> result = new LinkedHashMap<>();
        for (Language language : targets) {
            List<String> translatedList = new ArrayList<>(texts.size());
            boolean ok = true;
            for (String text : texts) {
                String translated = translateOne(text, language);
                if (translated == null) {
                    ok = false;
                    break;
                }
                translatedList.add(translated);
            }
            if (ok) {
                result.put(language, translatedList);
            }
        }
        return result;
    }

    /** text 를 target 언어로 한 건 번역. 실패 시 null. */
    private String translateOne(String text, Language target) {
        String targetCode = TARGET_CODES.get(target);
        if (targetCode == null) {
            log.warn("amazon translate 미지원 대상 언어 language={}", target);
            return null;
        }

        try {
            TranslateTextResponse response = translateClient.translateText(TranslateTextRequest.builder()
                    .text(text)
                    .sourceLanguageCode(SOURCE_LANG)
                    .targetLanguageCode(targetCode)
                    .build());
            return response.translatedText();
        } catch (Exception e) {
            log.warn("amazon translate 호출 실패 language={} message={}", target, e.getMessage());
            return null;
        }
    }
}
