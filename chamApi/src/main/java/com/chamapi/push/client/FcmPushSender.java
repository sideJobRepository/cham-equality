package com.chamapi.push.client;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Firebase Admin SDK로 FCM 발송.
 *
 * <p>서비스 계정 키는 env {@code FIREBASE_SERVICE_ACCOUNT_BASE64}(JSON 파일을 base64로 인코딩한 값)로 받는다.
 * 비어 있으면 발송을 끈 채로 부팅한다 — 로컬·테스트에서 키 없이도 서버가 떠야 해서다.
 * 앱 쪽 알림 채널 id({@link #ANDROID_CHANNEL_ID})는 chamApp {@code MainApplication}과 맞춰야 한다.
 */
@Component
@Slf4j
public class FcmPushSender implements PushSender {

    public static final String ANDROID_CHANNEL_ID = "disaster";

    private static final String APP_NAME = "cham-push";
    private static final int MULTICAST_LIMIT = 500;

    private final FirebaseMessaging firebaseMessaging;

    public FcmPushSender(@Value("${firebase.service-account-base64:}") String serviceAccountBase64) {
        this.firebaseMessaging = initialize(serviceAccountBase64);
    }

    @Override
    public boolean isEnabled() {
        return firebaseMessaging != null;
    }

    @Override
    public List<String> send(List<String> tokens, String title, String body, Map<String, String> data) {
        List<String> invalidTokens = new ArrayList<>();
        if (!isEnabled() || tokens.isEmpty()) {
            return invalidTokens;
        }
        for (int from = 0; from < tokens.size(); from += MULTICAST_LIMIT) {
            List<String> chunk = tokens.subList(from, Math.min(from + MULTICAST_LIMIT, tokens.size()));
            BatchResponse response = sendChunk(chunk, title, body, data);
            List<SendResponse> responses = response.getResponses();
            for (int i = 0; i < responses.size(); i++) {
                if (isInvalidToken(responses.get(i))) {
                    invalidTokens.add(chunk.get(i));
                }
            }
            log.info("push sent success={} failure={}", response.getSuccessCount(), response.getFailureCount());
        }
        return invalidTokens;
    }

    private BatchResponse sendChunk(List<String> tokens, String title, String body, Map<String, String> data) {
        MulticastMessage message = MulticastMessage.builder()
                .addAllTokens(tokens)
                .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                .putAllData(data)
                .setAndroidConfig(AndroidConfig.builder()
                        .setPriority(AndroidConfig.Priority.HIGH)
                        .setNotification(AndroidNotification.builder().setChannelId(ANDROID_CHANNEL_ID).build())
                        .build())
                .build();
        try {
            return firebaseMessaging.sendEachForMulticast(message);
        } catch (FirebaseMessagingException e) {
            throw new PushSendException("FCM 발송 실패: " + e.getMessage(), e);
        }
    }

    /** 앱 삭제·토큰 만료로 다시는 닿지 않는 토큰. 일시 오류(UNAVAILABLE 등)는 지우지 않는다. */
    private boolean isInvalidToken(SendResponse response) {
        if (response.isSuccessful() || response.getException() == null) {
            return false;
        }
        MessagingErrorCode code = response.getException().getMessagingErrorCode();
        return code == MessagingErrorCode.UNREGISTERED || code == MessagingErrorCode.INVALID_ARGUMENT;
    }

    private FirebaseMessaging initialize(String serviceAccountBase64) {
        if (serviceAccountBase64 == null || serviceAccountBase64.isBlank()) {
            log.warn("FIREBASE_SERVICE_ACCOUNT_BASE64 not set — push sending disabled");
            return null;
        }
        try {
            FirebaseApp app = FirebaseApp.getApps().stream()
                    .filter(existing -> existing.getName().equals(APP_NAME))
                    .findFirst()
                    .orElse(null);
            if (app == null) {
                byte[] json = Base64.getDecoder().decode(serviceAccountBase64.trim());
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(new ByteArrayInputStream(json)))
                        .build();
                app = FirebaseApp.initializeApp(options, APP_NAME);
            }
            return FirebaseMessaging.getInstance(app);
        } catch (IOException | IllegalArgumentException e) {
            log.error("firebase init failed — push sending disabled: {}", e.getMessage());
            return null;
        }
    }
}
