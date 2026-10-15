package com.chamapi.appupdate.service;

import com.chamapi.appupdate.dto.request.AppBundleCreateRequest;
import com.chamapi.appupdate.dto.response.AppBundleCheckResponse;
import com.chamapi.appupdate.dto.response.AppBundleResponse;

import java.util.List;

public interface AppBundleService {

    /**
     * 앱이 받을 번들을 고른다. 받을 게 없으면 null.
     * 선택 규칙은 hot-updater 서버의 fingerprint 전략과 같다(롤아웃 비율 기능만 뺐다).
     */
    AppBundleCheckResponse check(String platform, String channel, String fingerprint,
                                 String bundleId, String minBundleId);

    /** CI가 S3에 올린 번들을 등록한다. 테스터 채널로 시작한다. */
    AppBundleResponse register(AppBundleCreateRequest request);

    /** 테스터에게만 가던 켜진 번들을 전부 전체 사용자에게 승격한다. */
    List<AppBundleResponse> promoteAll();

    /** 끄면 이 번들을 받은 기기가 직전 번들로 롤백한다. */
    AppBundleResponse changeEnabled(String uuid, boolean enabled);

    List<AppBundleResponse> findRecent(int limit);
}
