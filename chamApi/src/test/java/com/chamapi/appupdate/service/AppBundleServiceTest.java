package com.chamapi.appupdate.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.appupdate.dto.request.AppBundleCreateRequest;
import com.chamapi.appupdate.dto.response.AppBundleCheckResponse;
import com.chamapi.appupdate.dto.response.AppBundleResponse;
import com.chamapi.common.exception.BadRequestException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class AppBundleServiceTest extends RepositoryAndServiceTestSupport {

    private static final String NIL = "00000000-0000-0000-0000-000000000000";
    // 앱 내장 번들 id. 등록 번들(0199…)보다 옛것.
    private static final String BUILT_IN = "01980000-0000-7000-8000-000000000000";
    private static final String BUNDLE_1 = "01990000-0000-7000-8000-000000000001";
    private static final String BUNDLE_2 = "01990000-0000-7000-8000-000000000002";
    private static final String HASH = "a".repeat(64);

    @Autowired
    private AppBundleService appBundleService;

    /** 실제 운영 행과 섞이지 않게 테스트마다 다른 지문을 쓴다. */
    private String uniqueFingerprint() {
        return "test-fp-" + System.nanoTime();
    }

    private void register(String uuid, String fingerprint, String channel) {
        appBundleService.register(new AppBundleCreateRequest(uuid, "android", channel, fingerprint,
                "app-bundles/android/" + uuid + ".zip", HASH, "abc1234", "테스트", false));
    }

    @DisplayName("내장 번들로 도는 앱은 같은 지문의 새 번들을 UPDATE로 받는다")
    @Test
    void test1() {
        String fingerprint = uniqueFingerprint();
        register(BUNDLE_1, fingerprint, "production");

        AppBundleCheckResponse response = appBundleService.check("android", "production", fingerprint, BUILT_IN, BUILT_IN);

        assertThat(response.status()).isEqualTo("UPDATE");
        assertThat(response.id()).isEqualTo(BUNDLE_1);
        assertThat(response.fileHash()).isEqualTo(HASH);
        assertThat(response.fileUrl()).contains("app-bundles/android/" + BUNDLE_1 + ".zip");
    }

    @DisplayName("지문이 다르면 아무것도 받지 않는다")
    @Test
    void test2() {
        String fingerprint = uniqueFingerprint();
        register(BUNDLE_1, fingerprint, "production");

        assertThat(appBundleService.check("android", "production", "other-" + fingerprint, BUILT_IN, BUILT_IN)).isNull();
    }

    @DisplayName("테스터 채널 번들은 일반 기기엔 안 가고 테스터 기기만 받는다")
    @Test
    void test3() {
        String fingerprint = uniqueFingerprint();
        register(BUNDLE_1, fingerprint, null);

        assertThat(appBundleService.check("android", "production", fingerprint, BUILT_IN, BUILT_IN)).isNull();
        assertThat(appBundleService.check("android", "alpha", fingerprint, BUILT_IN, BUILT_IN).id()).isEqualTo(BUNDLE_1);
    }

    @DisplayName("승격하면 일반 기기도 받고, 테스터 기기는 이미 받은 번들에서 그대로 머문다")
    @Test
    void test4() {
        String fingerprint = uniqueFingerprint();
        register(BUNDLE_1, fingerprint, null);

        List<AppBundleResponse> promoted = appBundleService.promoteAll();

        assertThat(promoted).extracting(AppBundleResponse::uuid).contains(BUNDLE_1);
        assertThat(appBundleService.check("android", "production", fingerprint, BUILT_IN, BUILT_IN).id()).isEqualTo(BUNDLE_1);
        assertThat(appBundleService.check("android", "alpha", fingerprint, BUNDLE_1, BUILT_IN)).isNull();
    }

    @DisplayName("지금 번들을 끄면 직전 번들로 ROLLBACK, 직전도 없으면 내장 번들로 ROLLBACK")
    @Test
    void test5() {
        String fingerprint = uniqueFingerprint();
        register(BUNDLE_1, fingerprint, "production");
        register(BUNDLE_2, fingerprint, "production");

        appBundleService.changeEnabled(BUNDLE_2, false);
        AppBundleCheckResponse toPrevious = appBundleService.check("android", "production", fingerprint, BUNDLE_2, BUILT_IN);
        assertThat(toPrevious.status()).isEqualTo("ROLLBACK");
        assertThat(toPrevious.id()).isEqualTo(BUNDLE_1);
        assertThat(toPrevious.shouldForceUpdate()).isTrue();

        appBundleService.changeEnabled(BUNDLE_1, false);
        AppBundleCheckResponse toBuiltIn = appBundleService.check("android", "production", fingerprint, BUNDLE_1, BUILT_IN);
        assertThat(toBuiltIn.status()).isEqualTo("ROLLBACK");
        assertThat(toBuiltIn.id()).isEqualTo(NIL);
        assertThat(toBuiltIn.fileUrl()).isNull();
    }

    @DisplayName("앱 내장 번들보다 옛 번들은 스토어 업데이트 뒤엔 받지 않는다")
    @Test
    void test6() {
        String fingerprint = uniqueFingerprint();
        register(BUNDLE_1, fingerprint, "production");
        String newerBuiltIn = "019a0000-0000-7000-8000-000000000000";

        assertThat(appBundleService.check("android", "production", fingerprint, newerBuiltIn, newerBuiltIn)).isNull();
    }

    @DisplayName("형식이 틀린 등록과 중복 등록은 400")
    @Test
    void test7() {
        String fingerprint = uniqueFingerprint();
        register(BUNDLE_1, fingerprint, null);

        assertThatThrownBy(() -> register(BUNDLE_1, fingerprint, null))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> appBundleService.register(new AppBundleCreateRequest(BUNDLE_2, "android", null,
                fingerprint, "other/" + BUNDLE_2 + ".zip", HASH, null, null, null)))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> appBundleService.register(new AppBundleCreateRequest(BUNDLE_2, "android", null,
                fingerprint, "app-bundles/android/x.zip", "not-a-hash", null, null, null)))
                .isInstanceOf(BadRequestException.class);
    }
}
