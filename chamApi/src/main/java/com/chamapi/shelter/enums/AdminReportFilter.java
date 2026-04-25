package com.chamapi.shelter.enums;

/**
 * 관리자 신고 검토 페이지의 필터 옵션.
 * PENDING/APPROVED/REJECTED는 {@link ShelterInfoReportStatus}와 1:1로 매핑되고,
 * RE_INVESTIGATION은 "Shelter.surveyStatus = RE_INVESTIGATION 인 대피소에 새로 들어온 PENDING 신고"를 의미한다.
 */
public enum AdminReportFilter {
    PENDING,
    APPROVED,
    REJECTED,
    RE_INVESTIGATION
}
