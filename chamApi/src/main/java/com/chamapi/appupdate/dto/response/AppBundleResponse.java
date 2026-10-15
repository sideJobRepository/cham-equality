package com.chamapi.appupdate.dto.response;

import com.chamapi.appupdate.entity.AppBundle;

import java.time.LocalDateTime;

/** 관리자·CI 확인용 번들 정보. */
public record AppBundleResponse(
        String uuid,
        String platform,
        String channel,
        String fingerprint,
        String gitCommit,
        String message,
        boolean enabled,
        boolean forceUpdate,
        LocalDateTime createDate
) {
    public static AppBundleResponse from(AppBundle bundle) {
        return new AppBundleResponse(
                bundle.getUuid(),
                bundle.getPlatform().name(),
                bundle.getChannel().name(),
                bundle.getFingerprint(),
                bundle.getGitCommit(),
                bundle.getMessage(),
                bundle.isEnabled(),
                bundle.isForceUpdate(),
                bundle.getCreateDate()
        );
    }
}
