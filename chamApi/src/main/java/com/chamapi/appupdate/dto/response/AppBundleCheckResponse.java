package com.chamapi.appupdate.dto.response;

/**
 * 업데이트 확인 응답. 형식은 hot-updater 클라이언트의 {@code AppUpdateInfo}와 같다.
 *
 * <p>{@code status}는 UPDATE(새 번들 받기) 또는 ROLLBACK(현재 번들이 꺼져서 직전 번들로).
 * ROLLBACK인데 {@code id}가 NIL UUID이고 {@code fileUrl}이 null이면 앱 내장 번들로 돌아가라는 뜻이다.
 * 받을 게 없으면 응답의 data 자체가 null이다.
 */
public record AppBundleCheckResponse(
        String id,
        String status,
        boolean shouldForceUpdate,
        String message,
        String fileUrl,
        String fileHash
) {
}
