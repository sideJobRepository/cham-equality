package com.chamapi.disaster.repository.query;

import com.chamapi.disaster.entity.DisasterMessage;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface DisasterMessageQueryRepository {

    Set<Long> findExistingSns(List<Long> sns);

    List<DisasterMessage> findLatest(String region, int limit);

    /** 아직 푸시 처리되지 않은 재난문자 (스케줄러 발송 대상). */
    List<DisasterMessage> findPushPending();

    /** 가장 최근 발행된 재난문자 (관리자 테스트 발송용). */
    Optional<DisasterMessage> findLatestOne();
}
