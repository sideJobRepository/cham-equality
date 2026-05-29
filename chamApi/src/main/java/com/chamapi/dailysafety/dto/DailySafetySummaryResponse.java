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
        return new DailySafetySummaryResponse(
                summary.getOriginTitle(),
                summary.getOriginUrl(),
                summary.getSummary(),
                summary.getCreateDate()
        );
    }
}
