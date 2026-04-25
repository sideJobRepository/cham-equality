package com.chamapi.shelter.enums;

/**
 * 시민/관리자 대피소 목록 화면의 상태 필터.
 * 목록에 표시되는 뱃지 우선순위와 동일하다(완료/재조사 > 제출됨 > 미제출).
 */
public enum ShelterSearchFilter {

    /** surveyStatus = INVESTIGATED. */
    COMPLETED,

    /** surveyStatus = RE_INVESTIGATION. */
    RE_INVESTIGATION,

    /** surveyStatus = NOT_INVESTIGATED 이고 PENDING 신고가 1건 이상. */
    SUBMITTED,

    /** surveyStatus = NOT_INVESTIGATED 이고 PENDING 신고가 없음. */
    NOT_SUBMITTED
}
