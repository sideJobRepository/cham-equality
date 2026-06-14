package com.chamapi.multilingual.entity;

import com.chamapi.common.entity.DateSuperClass;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.IDENTITY;

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

    // 메뉴/화면 구분
    @Column(name = "MENU")
    private String menu;

    // 텍스트 키
    @Column(name = "NAME")
    private String name;

    // 언어 코드 (KO/EN/ZH/JA/VI)
    @Enumerated(EnumType.STRING)
    @Column(name = "LANGUAGE")
    private Language language;

    // 번역 내용
    @Column(name = "CONT")
    private String cont;
}
