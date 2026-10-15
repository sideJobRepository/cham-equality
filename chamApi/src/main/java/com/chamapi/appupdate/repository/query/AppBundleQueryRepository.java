package com.chamapi.appupdate.repository.query;

import com.chamapi.appupdate.entity.AppBundle;
import com.chamapi.appupdate.enums.AppBundleChannel;
import com.chamapi.appupdate.enums.AppBundlePlatform;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AppBundleQueryRepository {

    /** UNIQUE 제약이 없어 첫 행만 본다(등록 때 중복을 막으므로 보통 1건). */
    Optional<AppBundle> findByUuid(String uuid);

    /** 업데이트 후보: 플랫폼·지문이 같고 보이는 채널에 속한 켜진 번들. */
    List<AppBundle> findCandidates(AppBundlePlatform platform, String fingerprint, Collection<AppBundleChannel> channels);

    /** 승격 대상: 아직 테스터에게만 가는 켜진 번들. */
    List<AppBundle> findPromotable();

    /** 관리자 확인용 최근 번들(최신순). */
    List<AppBundle> findRecent(int limit);
}
