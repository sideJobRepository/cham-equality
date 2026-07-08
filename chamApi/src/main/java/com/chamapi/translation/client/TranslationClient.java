package com.chamapi.translation.client;

import com.azure.ai.translation.text.TextTranslationClient;
import com.azure.ai.translation.text.models.TranslateInputItem;
import com.azure.ai.translation.text.models.TranslatedTextItem;
import com.azure.ai.translation.text.models.TranslationTarget;
import com.chamapi.multilingual.entity.Language;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Azure AI Translator 로 한국어 텍스트를 지정 언어들로 번역.
 * 한 번의 요청으로 전체 대상 언어(그리고 리스트 번역이면 전체 문장)를 동시에 번역한다.
 * 호출이 실패하면 빈 맵을 돌려 호출자(적재)가 원문(KO)만 저장하거나 다음 주기에 재시도하게 한다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TranslationClient {

    private static final String SOURCE_LANG = "ko";

    // Language enum → Azure Translator 언어 코드. KO 는 소스라 대상에서 제외됨.
    // 중국어는 Azure 에서 zh-Hans(간체) 코드를 사용한다.
    private static final Map<Language, String> TARGET_CODES = Map.of(
            Language.EN, "en",
            Language.ZH, "zh-Hans",
            Language.JA, "ja",
            Language.VI, "vi");

    private final TextTranslationClient textTranslationClient;

    /**
     * text 를 targets 각 언어로 번역. 키는 대상 언어, 값은 번역문.
     * 번역 호출이 실패하면 빈 맵.
     */
    public Map<Language, String> translate(String text, List<Language> targets) {
        if (text == null || text.isBlank() || targets == null || targets.isEmpty()) {
            return Map.of();
        }

        Map<Language, List<String>> byLanguage = translateList(List.of(text), targets);

        Map<Language, String> result = new LinkedHashMap<>();
        byLanguage.forEach((language, list) -> result.put(language, list.get(0)));
        return result;
    }

    /**
     * texts(한국어 문장 리스트)를 targets 각 언어로 번역. 값은 입력과 같은 개수·순서의 리스트.
     * 한 번의 배치 요청으로 전체 문장·전체 언어를 번역하며, 요청이 실패하면 빈 맵.
     */
    public Map<Language, List<String>> translateList(List<String> texts, List<Language> targets) {
        if (texts == null || texts.isEmpty() || targets == null || targets.isEmpty()) {
            return Map.of();
        }

        // 지원되는 대상 언어만 추린다 (요청 순서 = 응답 translations 순서).
        List<Language> orderedLanguages = new ArrayList<>();
        List<TranslationTarget> translationTargets = new ArrayList<>();
        for (Language language : targets) {
            String code = TARGET_CODES.get(language);
            if (code == null) {
                log.warn("azure translator 미지원 대상 언어 language={}", language);
                continue;
            }
            orderedLanguages.add(language);
            translationTargets.add(new TranslationTarget(code));
        }
        if (translationTargets.isEmpty()) {
            return Map.of();
        }

        // 문장 하나당 TranslateInputItem 하나(모두 동일한 대상 언어), 소스는 KO 로 명시.
        List<TranslateInputItem> inputs = new ArrayList<>(texts.size());
        for (String text : texts) {
            TranslateInputItem input = new TranslateInputItem(text, translationTargets);
            input.setLanguage(SOURCE_LANG);
            inputs.add(input);
        }

        List<TranslatedTextItem> items;
        try {
            items = textTranslationClient.translate(inputs);
        } catch (Exception e) {
            log.warn("azure translator 호출 실패 message={}", e.getMessage());
            return Map.of();
        }

        // 응답 개수·구조 방어: 기대와 다르면 전체 실패로 취급해 재시도하게 한다.
        if (items == null || items.size() != texts.size()) {
            log.warn("azure translator 응답 개수 불일치 expected={} actual={}",
                    texts.size(), items == null ? null : items.size());
            return Map.of();
        }

        Map<Language, List<String>> result = new LinkedHashMap<>();
        for (int langIndex = 0; langIndex < orderedLanguages.size(); langIndex++) {
            List<String> translatedTexts = new ArrayList<>(texts.size());
            for (TranslatedTextItem item : items) {
                if (item.getTranslations() == null || item.getTranslations().size() <= langIndex) {
                    log.warn("azure translator 번역 결과 누락 language={}", orderedLanguages.get(langIndex));
                    return Map.of();
                }
                translatedTexts.add(item.getTranslations().get(langIndex).getText());
            }
            result.put(orderedLanguages.get(langIndex), translatedTexts);
        }
        return result;
    }
}
