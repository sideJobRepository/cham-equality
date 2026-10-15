package com.chamapi.appupdate.enums;

import com.chamapi.common.exception.BadRequestException;

import java.util.Arrays;

public enum AppBundlePlatform {
    ANDROID,
    IOS;

    /** 앱·CI가 보내는 값(android/ios, 대소문자 무관)을 enum으로. */
    public static AppBundlePlatform from(String value) {
        return Arrays.stream(values())
                .filter(platform -> platform.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("지원하지 않는 플랫폼입니다: " + value));
    }
}
