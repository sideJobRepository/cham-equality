package com.chamapi.push.client;

import java.util.List;
import java.util.Map;

/**
 * 푸시 발송 창구. 실제 구현은 {@link FcmPushSender}이고, 테스트에선 가짜 구현으로 바꿔 끼운다.
 */
public interface PushSender {

    /** 발송 키가 설정돼 있어 실제로 보낼 수 있는지. */
    boolean isEnabled();

    /**
     * 같은 내용을 여러 토큰에 보낸다.
     *
     * @return 더는 유효하지 않아 지워야 할 토큰 목록(앱 삭제·토큰 만료 등)
     * @throws PushSendException 발송 자체가 실패했을 때(인증·네트워크 등) — 호출 측이 다음 주기에 재시도한다
     */
    List<String> send(List<String> tokens, String title, String body, Map<String, String> data);

    class PushSendException extends RuntimeException {
        public PushSendException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
