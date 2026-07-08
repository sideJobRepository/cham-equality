package com.chamapi.multilingual.entity;

import com.chamapi.common.entity.DateSuperClass;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.IDENTITY;

/**
 * 도메인 콘텐츠의 언어별 번역 저장 테이블(다국어).
 * (translationType, targetId, language) 로 원본 행의 언어별 번역문을 구분한다.
 *   translationType = 콘텐츠 종류(재난문자/일일재난안전), targetId = 원본 행 ID, cont = 번역문(평문 또는 JSON 배열).
 */
@Table(name = "MULTILINGUAL")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Multilingual extends DateSuperClass {

    // 다국어 ID
    @Id
    @Column(name = "MULTILINGUAL_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long multilingualId;

    // 번역 타입 (콘텐츠 종류)
    @Column(name = "TRANSLATION_TYPE")
    private String translationType;

    // 타겟 ID (원본 행 ID)
    @Column(name = "TARGET_ID")
    private Long targetId;

    // 번역 제목 (제목이 있는 콘텐츠만 채움, 재난문자 등은 null)
    @Column(name = "TRANSLATION_TITLE")
    private String translationTitle;

    // 언어 코드 (KO/EN/ZH/JA/VI)
    @Enumerated(EnumType.STRING)
    @Column(name = "LANGUAGE")
    private Language language;

    // 번역 내용
    @Column(name = "CONT", columnDefinition = "TEXT")
    private String cont;

    // 번역된 카테고리 (재난문자의 산불/화재 등, 없으면 null)
    @Column(name = "CATEGORY")
    private String category;
}
