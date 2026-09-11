package com.chamapi.feedback.dto.request;

import com.chamapi.feedback.enums.AppFeedbackCategory;

import java.util.List;

/**
 * 작성자 본인이 자기 피드백을 고칠 때 쓰는 요청. 접수 시점 기록인 환경 정보
 * (appVersion/platform/osVersion/deviceModel/screen)는 수정 대상이 아니라 빠져 있다.
 *
 * <p>{@code imageFileIds}는 변경분이 아니라 <b>최종 상태 전체</b>다.
 * null(또는 생략)이면 사진을 건드리지 않고, 빈 배열이면 전부 떼어내며,
 * 목록을 주면 그 목록과 같아지도록 서버가 차집합을 계산해 붙이고 뗀다.
 */
public record AppFeedbackUpdateRequest(
        AppFeedbackCategory category,
        String content,
        String contact,
        List<Long> imageFileIds
) {}
