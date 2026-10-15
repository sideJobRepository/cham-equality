package com.chamapi.appupdate.entity;

import com.chamapi.appupdate.enums.AppBundleChannel;
import com.chamapi.appupdate.enums.AppBundlePlatform;
import com.chamapi.common.entity.DateSuperClass;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static jakarta.persistence.GenerationType.IDENTITY;

/**
 * 스토어 심사 없이 내려보내는 JS 번들(OTA) 한 건. 앱 쪽은 hot-updater 라이브러리가 받아 다음 실행부터 적용한다.
 *
 * <p>DB 컬럼이 전부 NULL 허용·기본값 없음이라, 활성·강제 업데이트·채널 기본값은 생성자에서 채운다.
 * UUID UNIQUE 제약도 없어 중복 등록은 서비스에서 조회로 막는다.
 */
@Table(name = "APP_BUNDLE")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppBundle extends DateSuperClass {

    // 앱 번들 ID
    @Id
    @Column(name = "APP_BUNDLE_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    // hot-updater 번들 id(UUIDv7). 시간순으로 커져서 문자열 비교로 새것/옛것을 가린다.
    @Column(name = "APP_BUNDLE_UUID")
    private String uuid;

    @Enumerated(EnumType.STRING)
    @Column(name = "APP_BUNDLE_PLATFORM")
    private AppBundlePlatform platform;

    @Enumerated(EnumType.STRING)
    @Column(name = "APP_BUNDLE_CHANNEL")
    private AppBundleChannel channel;

    // 네이티브 지문. 앱의 지문과 같을 때만 내려준다(네이티브가 다른 앱에 새 JS가 가서 꺼지는 것 방지).
    @Column(name = "APP_BUNDLE_FINGERPRINT")
    private String fingerprint;

    // S3 객체 키(예: app-bundles/android/{uuid}.zip). 앱엔 presigned URL로 준다.
    @Column(name = "APP_BUNDLE_S3_KEY")
    private String s3Key;

    // zip 파일 SHA-256(소문자 hex). 앱이 받은 뒤 무결성 검사에 쓴다.
    @Column(name = "APP_BUNDLE_FILE_HASH")
    private String fileHash;

    @Column(name = "APP_BUNDLE_GIT_COMMIT")
    private String gitCommit;

    @Column(name = "APP_BUNDLE_MESSAGE")
    private String message;

    // 끄면 이 번들을 받은 기기는 다음 확인 때 직전 번들(없으면 앱 내장 번들)로 롤백한다.
    @Column(name = "APP_BUNDLE_ENABLED_WHETHER")
    private boolean enabled;

    // 켜면 받자마자 재시작해 적용한다. 끄면 다음 실행 때 적용.
    @Column(name = "APP_BUNDLE_FORCE_UPDATE_WHETHER")
    private boolean forceUpdate;

    /** 채널을 안 넘기면 ALPHA(테스터만). 새 번들은 항상 켜진 상태로 만든다. */
    @Builder
    public AppBundle(String uuid, AppBundlePlatform platform, AppBundleChannel channel, String fingerprint,
                     String s3Key, String fileHash, String gitCommit, String message, Boolean forceUpdate) {
        this.uuid = uuid;
        this.platform = platform;
        this.channel = channel == null ? AppBundleChannel.ALPHA : channel;
        this.fingerprint = fingerprint;
        this.s3Key = s3Key;
        this.fileHash = fileHash;
        this.gitCommit = gitCommit;
        this.message = message;
        this.enabled = true;
        this.forceUpdate = forceUpdate != null && forceUpdate;
    }

    public void promote() {
        this.channel = AppBundleChannel.PRODUCTION;
    }

    public void changeEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
