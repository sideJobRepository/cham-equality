package com.chamapi.push.repository.query;

import com.chamapi.push.entity.PushToken;

import java.util.Collection;
import java.util.List;

public interface PushTokenQueryRepository {

    /** UNIQUE 제약이 없어 같은 토큰이 여러 행일 수 있다. */
    List<PushToken> findAllByValue(String value);

    void deleteAllByValueIn(Collection<String> values);

    /** 재난문자 알림을 켠 기기. */
    List<PushToken> findAllDisasterEnabled();

    /** 회원의 기기 중 개인 알림을 켠 것. */
    List<PushToken> findAllPersonalEnabledByMemberId(Long memberId);

    List<PushToken> findAllPersonalEnabledByMemberIds(Collection<Long> memberIds);
}
