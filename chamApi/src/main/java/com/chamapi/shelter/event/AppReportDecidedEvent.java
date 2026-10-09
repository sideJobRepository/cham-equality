package com.chamapi.shelter.event;

/**
 * 관리자가 앱 제보를 승인·반려했을 때 발행. 커밋 뒤 푸시 모듈이 받아 제보한 회원에게 결과를 알린다.
 * 제보 서비스가 푸시를 직접 부르지 않게 해, 푸시가 실패하거나 느려도 승인·반려에 영향이 없다.
 */
public record AppReportDecidedEvent(Long memberId, Long reportId, String shelterName, Result result) {

    public enum Result {
        APPROVED,
        REJECTED,
        /** 같은 대피소의 다른 제보가 먼저 승인돼 자동으로 반려됨. */
        REJECTED_OTHER_APPROVED
    }
}
