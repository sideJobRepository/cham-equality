package com.chamapi.appupdate.dto.request;

/**
 * CI가 S3에 번들 zip을 올린 뒤 등록하는 요청.
 * {@code platform}은 android/ios, {@code channel}은 비우면 alpha(테스터만).
 * {@code fileHash}는 zip의 SHA-256 소문자 hex 64자.
 */
public record AppBundleCreateRequest(
        String uuid,
        String platform,
        String channel,
        String fingerprint,
        String s3Key,
        String fileHash,
        String gitCommit,
        String message,
        Boolean forceUpdate
) {
}
