package com.chamapi.multilingual.service;

import com.chamapi.multilingual.entity.Language;
import com.chamapi.multilingual.entity.Multilingual;
import com.chamapi.multilingual.repository.MultilingualRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 도메인 콘텐츠(재난문자·일일요약 등)의 언어별 번역을 MULTILINGUAL 한 테이블에 저장/조회하는 재사용 지점.
 * TRANSLATION_TYPE=콘텐츠 종류, TARGET_ID=원본 행 ID, TRANSLATION_TITLE=번역 제목(없으면 null), CONT=번역 내용(평문 또는 JSON 배열).
 * 새 콘텐츠 종류는 여기에 타입 상수 하나 추가하고 save/load 를 호출하면 된다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MultilingualContentService {

    public static final String TYPE_DISASTER_MESSAGE = "재난문자";
    public static final String TYPE_DAILY_SAFETY_SUMMARY = "일일재난안전";

    /** 한 언어의 번역 단위. 제목이 없는 콘텐츠(재난문자 등)는 title=null, 카테고리가 없으면 category=null. */
    public record Translated(String title, String cont, String category) {
        /** 카테고리가 없는 콘텐츠(일일요약 등)용 편의 생성자. */
        public Translated(String title, String cont) {
            this(title, cont, null);
        }
    }

    private final MultilingualRepository multilingualRepository;

    /** 한 대상 행의 언어별 번역을 저장. byLanguage 에 KO(원문)까지 포함해 넘긴다. */
    @Transactional
    public void save(String translationType, Long targetId, Map<Language, Translated> byLanguage) {
        List<Multilingual> rows = byLanguage.entrySet().stream()
                .map(entry -> Multilingual.builder()
                        .translationType(translationType)
                        .targetId(targetId)
                        .language(entry.getKey())
                        .translationTitle(entry.getValue().title())
                        .cont(entry.getValue().cont())
                        .category(entry.getValue().category())
                        .build())
                .toList();
        multilingualRepository.saveAll(rows);
    }

    /** 여러 대상 행의 지정 언어 번역을 targetId → (language → Translated) 로 조회. */
    public Map<Long, Map<Language, Translated>> load(String translationType, List<Long> targetIds, List<Language> languages) {
        if (targetIds.isEmpty() || languages.isEmpty()) {
            return Map.of();
        }
        return multilingualRepository.findByTranslationTypeAndTargetIdsAndLanguages(translationType, targetIds, languages).stream()
                .collect(Collectors.groupingBy(
                        Multilingual::getTargetId,
                        Collectors.toMap(
                                Multilingual::getLanguage,
                                row -> new Translated(row.getTranslationTitle(), row.getCont(), row.getCategory()),
                                (a, b) -> a)));
    }
}
