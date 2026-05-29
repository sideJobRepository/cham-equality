package com.chamapi.dailysafety.entity;

import com.chamapi.common.entity.DateSuperClass;
import com.chamapi.common.entity.converter.StringListConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.util.List;

import static jakarta.persistence.GenerationType.IDENTITY;

@Table(name = "DAILY_DISASTER_SAFETY_SUMMARY")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
public class DailySafetySummary extends DateSuperClass {

    @Id
    @Column(name = "SUMMARY_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @Column(name = "ORIGIN_TITLE", nullable = false, length = 500, unique = true)
    private String originTitle;

    @Column(name = "ORIGIN_URL", columnDefinition = "TEXT", nullable = false)
    private String originUrl;

    @Column(name = "REFINED_HTML", columnDefinition = "TEXT", nullable = false)
    private String refinedHtml;

    @Convert(converter = StringListConverter.class)
    @Column(name = "SUMMARY", columnDefinition = "TEXT", nullable = false)
    private List<String> summary;

    public DailySafetySummary(Long id, String originTitle, String originUrl, String refinedHtml, List<String> summary) {
        this.id = id;
        this.originTitle = originTitle;
        this.originUrl = originUrl;
        this.refinedHtml = refinedHtml;
        this.summary = summary;
    }
}
