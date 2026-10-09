package com.chamapi.push.entity;

import com.chamapi.common.entity.DateSuperClass;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.push.enums.PushPlatform;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import static jakarta.persistence.GenerationType.IDENTITY;

/**
 * 앱 기기의 FCM 토큰. 재난문자 푸시는 비로그인 사용자에게도 가야 해서 회원과 연결하지 않는다.
 *
 * <p>DB에 토큰 UNIQUE 제약이 없어 같은 토큰 행이 둘 생길 수 있다.
 * 등록은 기존 행을 찾아 갱신하고, 발송은 토큰 값 기준으로 중복을 걸러 한 기기에 두 번 가지 않게 한다.
 */
@Table(name = "PUSH_TOKEN")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PushToken extends DateSuperClass {

    // 푸시 토큰 ID
    @Id
    @Column(name = "PUSH_TOKEN_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    // 로그인한 기기면 회원 ID, 비로그인이면 null. 관리자의 회원 지정 푸시 대상 판별용.
    // 회원 탈퇴 시 DB FK(ON DELETE SET NULL)가 비워 기기는 재난 알림을 계속 받는다.
    @Column(name = "MEMBER_ID")
    private Long memberId;

    // FCM 토큰 값
    @Column(name = "PUSH_TOKEN_VALUE")
    private String value;

    // 플랫폼(ANDROID/IOS)
    @Enumerated(EnumType.STRING)
    @Column(name = "PUSH_TOKEN_PLATFORM")
    private PushPlatform platform;

    // 알림을 받을 언어(앱 UI 언어)
    @Enumerated(EnumType.STRING)
    @Column(name = "PUSH_TOKEN_LANGUAGE")
    private Language language;

    // 재난문자 알림을 받을지(앱 더보기의 토글). 꺼도 개인 알림은 따로 받는다.
    @Column(name = "DISASTER_MESSAGE_NOTIFICATION_WHETHER", nullable = false)
    private boolean disasterEnabled;

    // 개인 알림(제보 승인·반려, 관리자 회원 알림)을 받을지.
    @Column(name = "PRIVATE_NOTIFICATION_WHETHER", nullable = false)
    private boolean personalEnabled;

    // 앱이 마지막으로 토큰을 등록한 시각. MODIFY_DATE는 값이 바뀔 때만 갱신돼 활성 판단에 못 쓴다.
    @Column(name = "PUSH_TOKEN_LAST_ACTIVE_DATE")
    private LocalDateTime lastActiveDate;

    /** 알림 설정을 안 넘기면 둘 다 켠 상태로 만든다(DB 기본값과 같음). */
    @Builder
    public PushToken(Long memberId, String value, PushPlatform platform, Language language,
                     Boolean disasterEnabled, Boolean personalEnabled, LocalDateTime lastActiveDate) {
        this.memberId = memberId;
        this.value = value;
        this.platform = platform;
        this.language = language;
        this.disasterEnabled = disasterEnabled == null || disasterEnabled;
        this.personalEnabled = personalEnabled == null || personalEnabled;
        this.lastActiveDate = lastActiveDate;
    }

    /**
     * 같은 기기의 재등록 — 언어·플랫폼·로그인 상태·알림 설정이 바뀌었을 수 있어 함께 덮어쓴다.
     * 로그아웃 후 재등록이면 memberId가 null로 와서 회원 연결이 끊긴다.
     * 알림 설정이 null 이면(설정을 안 보내는 예전 앱) 기존 값을 둔다.
     */
    public void refresh(Long memberId, PushPlatform platform, Language language,
                        Boolean disasterEnabled, Boolean personalEnabled, LocalDateTime now) {
        this.memberId = memberId;
        this.platform = platform;
        this.language = language;
        if (disasterEnabled != null) this.disasterEnabled = disasterEnabled;
        if (personalEnabled != null) this.personalEnabled = personalEnabled;
        this.lastActiveDate = now;
    }
}
