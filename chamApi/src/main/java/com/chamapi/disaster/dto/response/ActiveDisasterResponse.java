package com.chamapi.disaster.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

/**
 * 메인 홈 배너용. active=false → 평상(녹색), true → 발령(빨강).
 * referenceTime 은 클라이언트가 "x분 전" 또는 "기준 시각" 표시에 사용.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ActiveDisasterResponse(boolean active, LocalDateTime referenceTime, DisasterMessageResponse message) {
    public static ActiveDisasterResponse inactive(LocalDateTime referenceTime) {
        return new ActiveDisasterResponse(false, referenceTime, null);
    }

    public static ActiveDisasterResponse active(LocalDateTime referenceTime, DisasterMessageResponse message) {
        return new ActiveDisasterResponse(true, referenceTime, message);
    }
}
