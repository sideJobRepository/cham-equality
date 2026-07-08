package com.chamapi.disaster.service.impl;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.disaster.config.SafetyDataProperties;
import com.chamapi.disaster.dto.response.DisasterMessageResponse;
import com.chamapi.disaster.entity.DisasterMessage;
import com.chamapi.disaster.repository.DisasterMessageRepository;
import com.chamapi.disaster.service.DisasterMessageService;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.multilingual.service.MultilingualContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class DisasterMessageServiceImpl implements DisasterMessageService {

    private static final int LATEST_LIMIT = 5;

    private final DisasterMessageRepository repository;
    private final MultilingualContentService multilingualContentService;
    private final SafetyDataProperties properties;

    @Override
    public List<DisasterMessageResponse> findLatest(String lang) {
        Language language = parseLanguage(lang);
        List<DisasterMessage> latest = repository.findLatest(properties.getRegion(), LATEST_LIMIT);
        if (latest.isEmpty()) {
            return List.of();
        }

        Map<Long, Map<Language, MultilingualContentService.Translated>> contentByMessage = loadTranslations(latest, language);

        return latest.stream()
                .map(m -> {
                    Map<Language, MultilingualContentService.Translated> byLanguage = contentByMessage.get(m.getId());
                    return DisasterMessageResponse.from(
                            m,
                            resolveContent(byLanguage, language, m.getContent()),
                            resolveCategory(byLanguage, language, m.getCategory()));
                })
                .toList();
    }

    @Override
    public DisasterMessageResponse findOne(Long id) {
        DisasterMessage m = repository.findById(id).orElseThrow(() -> new BadRequestException("재난문자를 찾을 수 없습니다."));
        return DisasterMessageResponse.from(m);
    }

    /** 잘못된 코드는 400 대신 KO 로 폴백 (배너 표시용 파라미터). */
    private Language parseLanguage(String lang) {
        try {
            return Language.fromCode(lang);
        } catch (BadRequestException e) {
            return Language.KO;
        }
    }

    private Map<Long, Map<Language, MultilingualContentService.Translated>> loadTranslations(List<DisasterMessage> messages, Language language) {
        List<Long> ids = messages.stream().map(DisasterMessage::getId).toList();
        List<Language> languages = language == Language.KO ? List.of(Language.KO) : List.of(language, Language.KO);

        return multilingualContentService.load(
                MultilingualContentService.TYPE_DISASTER_MESSAGE, ids, languages);
    }

    /** 요청 언어 → KO 행 → 원문 순으로 폴백. */
    private String resolveContent(Map<Language, MultilingualContentService.Translated> byLanguage, Language language, String origin) {
        if (byLanguage == null) {
            return origin;
        }
        MultilingualContentService.Translated requested = byLanguage.get(language);
        if (requested != null && requested.cont() != null) {
            return requested.cont();
        }
        MultilingualContentService.Translated ko = byLanguage.get(Language.KO);
        return ko != null && ko.cont() != null ? ko.cont() : origin;
    }

    /** 카테고리도 요청 언어 → KO 행 → 원문 순으로 폴백. 번역 저장 전 데이터는 원문(KO)으로 내려간다. */
    private String resolveCategory(Map<Language, MultilingualContentService.Translated> byLanguage, Language language, String origin) {
        if (byLanguage == null) {
            return origin;
        }
        MultilingualContentService.Translated requested = byLanguage.get(language);
        if (requested != null && requested.category() != null) {
            return requested.category();
        }
        MultilingualContentService.Translated ko = byLanguage.get(Language.KO);
        return ko != null && ko.category() != null ? ko.category() : origin;
    }
}
