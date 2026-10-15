package com.chamapi.appupdate.enums;

import com.chamapi.common.exception.BadRequestException;

import java.util.Arrays;
import java.util.List;

/**
 * OTA 번들을 누구에게 보낼지.
 *
 * <p>CI가 올린 번들은 {@link #ALPHA}로 시작하고, 관리자가 승격해야 {@link #PRODUCTION}이 된다.
 * 테스터 기기(더보기의 "베타 업데이트 받기"를 켠 기기)는 ALPHA로 확인을 요청하고 ALPHA·PRODUCTION 번들을 모두 본다.
 * 그래서 승격은 행의 채널만 바꾸면 되고, 테스터가 이미 받은 번들이 승격 때문에 롤백되는 일도 없다.
 */
public enum AppBundleChannel {
    ALPHA,
    PRODUCTION;

    public static AppBundleChannel from(String value) {
        return Arrays.stream(values())
                .filter(channel -> channel.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("지원하지 않는 채널입니다: " + value));
    }

    /** 이 채널로 확인을 요청한 기기가 받을 수 있는 번들 채널. */
    public List<AppBundleChannel> visibleChannels() {
        return this == ALPHA ? List.of(ALPHA, PRODUCTION) : List.of(PRODUCTION);
    }
}
