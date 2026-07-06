package com.chamapi.dailysafety.service;

import com.chamapi.common.entity.converter.StringListConverter;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.dailysafety.dto.DailySafetySummaryResponse;
import com.chamapi.dailysafety.entity.DailySafetySummary;
import com.chamapi.dailysafety.repository.DailySafetySummaryRepository;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.multilingual.service.MultilingualContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DailySafetyService {

    private static final StringListConverter LIST_CONVERTER = new StringListConverter();

    private final DailySafetySummaryRepository repository;
    private final MultilingualContentService multilingualContentService;

    /** 최신 일일 재난안전 요약. lang 번역본으로 제목·summary 를 채우되 없으면 KO(원문) 폴백. */
    public DailySafetySummaryResponse findLatest(String lang) {
        DailySafetySummary summary = repository.findLatest()
                .orElseThrow(() -> new BadRequestException("일일 재난안전 정보 요약을 찾을 수 없습니다."));

        Language language = parseLanguage(lang);
        List<Language> languages = language == Language.KO ? List.of(Language.KO) : List.of(language, Language.KO);
        Map<Language, MultilingualContentService.Translated> byLanguage = multilingualContentService
                .load(MultilingualContentService.TYPE_DAILY_SAFETY_SUMMARY, List.of(summary.getId()), languages)
                .getOrDefault(summary.getId(), Map.of());

        String title = resolveTitle(byLanguage, language, summary.getOriginTitle());
        List<String> summaryList = resolveSummary(byLanguage, language, summary.getSummary());
        return DailySafetySummaryResponse.from(summary, title, summaryList);
    }

    /** 잘못된 코드는 400 대신 KO 로 폴백. */
    private Language parseLanguage(String lang) {
        try {
            return Language.fromCode(lang);
        } catch (BadRequestException e) {
            return Language.KO;
        }
    }

    /** 요청 언어 → KO 행 → 원문 제목 순으로 폴백. */
    private String resolveTitle(Map<Language, MultilingualContentService.Translated> byLanguage, Language language, String originTitle) {
        MultilingualContentService.Translated requested = byLanguage.get(language);
        if (requested != null && requested.title() != null) {
            return requested.title();
        }
        MultilingualContentService.Translated ko = byLanguage.get(Language.KO);
        return ko != null && ko.title() != null ? ko.title() : originTitle;
    }

    /** 요청 언어 → KO 행 → 원문 순으로 폴백. CONT 는 JSON 배열 문자열이라 역직렬화한다. */
    private List<String> resolveSummary(Map<Language, MultilingualContentService.Translated> byLanguage, Language language, List<String> originSummary) {
        MultilingualContentService.Translated requested = byLanguage.get(language);
        if (requested != null && requested.cont() != null) {
            return LIST_CONVERTER.convertToEntityAttribute(requested.cont());
        }
        MultilingualContentService.Translated ko = byLanguage.get(Language.KO);
        return ko != null && ko.cont() != null ? LIST_CONVERTER.convertToEntityAttribute(ko.cont()) : originSummary;
    }
}
