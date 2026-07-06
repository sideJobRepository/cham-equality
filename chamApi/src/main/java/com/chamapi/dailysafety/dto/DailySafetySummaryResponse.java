package com.chamapi.dailysafety.dto;

import com.chamapi.dailysafety.entity.DailySafetySummary;

import java.time.LocalDateTime;
import java.util.List;

public record DailySafetySummaryResponse(
        String originTitle,
        String originUrl,
        List<String> summary,
        LocalDateTime createDate
) {
    public static DailySafetySummaryResponse from(DailySafetySummary summary) {
        return from(summary, summary.getOriginTitle(), summary.getSummary());
    }

    /** 제목·summary 를 요청 언어 번역본으로 대체해 반환. */
    public static DailySafetySummaryResponse from(DailySafetySummary summary, String title, List<String> summaryList) {
        return new DailySafetySummaryResponse(
                title,
                summary.getOriginUrl(),
                summaryList,
                summary.getCreateDate()
        );
    }
}
