package com.chamapi.shelter.enums;

public enum ShelterSurveyStatus {

    NOT_INVESTIGATED,   // 아직 승인된 적 없음. 비번 없이 시민 제출 허용.
    INVESTIGATED,       // 승인 1회 완료. 추가 제출 차단.
    RE_INVESTIGATION    // 관리자가 재조사 요청. 다시 제출 받되 USER_PASSWORD 필요.
}
