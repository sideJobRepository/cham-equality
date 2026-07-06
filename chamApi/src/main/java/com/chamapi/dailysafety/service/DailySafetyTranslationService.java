package com.chamapi.dailysafety.service;

import com.chamapi.common.entity.converter.StringListConverter;
import com.chamapi.dailysafety.entity.DailySafetySummary;
import com.chamapi.dailysafety.repository.DailySafetySummaryRepository;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.multilingual.service.MultilingualContentService;
import com.chamapi.translation.client.TranslationClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 크롤러(Python)가 적재한 일일 재난안전 요약을 주기적으로 번역해 MULTILINGUAL 에 채운다.
 * 번역이 전부 실패하면 아무 행도 넣지 않아 다음 주기에 재시도한다.
 * 요약은 문자열 리스트라 StringListConverter 로 JSON 배열 문자열로 직렬화해 CONT 에 저장한다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DailySafetyTranslationService {

    // KO 를 제외한 번역 대상 언어 전체 (EN/ZH/JA/VI).
    private static final List<Language> TARGET_LANGUAGES = Arrays.stream(Language.values())
            .filter(language -> language != Language.KO)
            .toList();

    private static final StringListConverter LIST_CONVERTER = new StringListConverter();

    private final DailySafetySummaryRepository summaryRepository;
    private final MultilingualContentService multilingualContentService;
    private final TranslationClient translationClient;

    @Transactional
    public void translateUntranslated() {
        List<DailySafetySummary> targets = summaryRepository.findByTranslationWhetherFalse();
        for (DailySafetySummary summary : targets) {
            translateOne(summary);
        }
    }

    private void translateOne(DailySafetySummary summary) {
        String originTitle = summary.getOriginTitle();

        // 요약이 비어있으면 KO 행만 넣고 번역 완료로 마킹해 무한 재시도를 막는다.
        if (summary.getSummary() == null || summary.getSummary().isEmpty()) {
            Map<Language, MultilingualContentService.Translated> koOnly = new LinkedHashMap<>();
            koOnly.put(Language.KO, translated(originTitle, summary.getSummary()));
            multilingualContentService.save(MultilingualContentService.TYPE_DAILY_SAFETY_SUMMARY, summary.getId(), koOnly);
            summary.markTranslated();
            return;
        }

        Map<Language, List<String>> translatedSummary = translationClient.translateList(summary.getSummary(), TARGET_LANGUAGES);
        if (translatedSummary.isEmpty()) {
            // 번역 전부 실패 → 마킹하지 않아 다음 주기에 재시도.
            log.warn("daily safety translation empty, will retry. summaryId={}", summary.getId());
            return;
        }

        // 제목도 번역. 특정 언어 제목 번역이 없으면 원문 제목으로 폴백.
        Map<Language, String> translatedTitle = translationClient.translate(originTitle, TARGET_LANGUAGES);

        Map<Language, MultilingualContentService.Translated> byLanguage = new LinkedHashMap<>();
        byLanguage.put(Language.KO, translated(originTitle, summary.getSummary()));
        translatedSummary.forEach((language, list) ->
                byLanguage.put(language, translated(translatedTitle.getOrDefault(language, originTitle), list)));

        multilingualContentService.save(MultilingualContentService.TYPE_DAILY_SAFETY_SUMMARY, summary.getId(), byLanguage);
        summary.markTranslated();
    }

    /** 제목(평문) + 요약 리스트(JSON 배열 문자열)를 한 언어의 번역 단위로 만든다. */
    private MultilingualContentService.Translated translated(String title, List<String> summary) {
        return new MultilingualContentService.Translated(title, LIST_CONVERTER.convertToDatabaseColumn(summary));
    }
}
