package com.chamapi.manual.entity;

import com.chamapi.common.entity.DateSuperClass;
import com.chamapi.multilingual.entity.Language;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static jakarta.persistence.GenerationType.IDENTITY;

@Table(name = "MANUAL")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Manual extends DateSuperClass {

    @Id
    @Column(name = "MANUAL_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @Column(name = "MANUAL_LANGUAGE")
    @Enumerated(EnumType.STRING)
    private Language language;

    @Column(name = "MANUAL_TITLE")
    private String title;

    @Column(name = "MANUAL_CONTENT", columnDefinition = "TEXT")
    private String content;

    @Builder
    public Manual(Language language, String title, String content) {
        this.language = language;
        this.title = title;
        this.content = content;
    }

    public void update(Language language, String title, String content) {
        this.language = language;
        this.title = title;
        this.content = content;
    }
}
