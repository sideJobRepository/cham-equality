package com.chamapi.feedback.entity;

import com.chamapi.common.entity.DateSuperClass;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.feedback.enums.AppFeedbackCategory;
import com.chamapi.feedback.enums.AppFeedbackStatus;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.IDENTITY;

/**
 * 앱에서 보내는 자유 형식 피드백(비공개 테스트 피드백 창구).
 * 대피소 제보({@link com.chamapi.shelter.entity.ShelterInfoAppReport})와 달리 대피소에 반영되지 않고,
 * 관리자 웹에서 상태·메모만 관리한다.
 *
 * <p>{@code memberId}는 nullable이다. 로그인을 강제하면 참여율이 떨어져 비로그인 제출을 허용하기 때문이고,
 * 회원 탈퇴 시에도 행을 지우지 않고 {@link #detachMember()}로 익명화한다.
 */
@Table(name = "APP_FEEDBACK")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AppFeedback extends DateSuperClass {

    // 앱 피드백 ID
    @Id
    @Column(name = "APP_FEEDBACK_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    // 작성자 회원 ID(비로그인 제출 시 null)
    @Column(name = "MEMBER_ID")
    private Long memberId;

    // 피드백 분류
    @Enumerated(EnumType.STRING)
    @Column(name = "FEEDBACK_CATEGORY")
    private AppFeedbackCategory category;

    // 피드백 내용
    @Column(name = "FEEDBACK_CONTENT")
    private String content;

    // 회신용 연락처(선택 입력)
    @Column(name = "FEEDBACK_CONTACT")
    private String contact;

    // 처리 상태
    @Enumerated(EnumType.STRING)
    @Column(name = "FEEDBACK_STATUS")
    private AppFeedbackStatus status;

    // 관리자 처리 메모
    @Column(name = "FEEDBACK_ADMIN_NOTE")
    private String adminNote;

    // 앱 버전
    @Column(name = "FEEDBACK_APP_VERSION")
    private String appVersion;

    // 플랫폼(ANDROID/IOS)
    @Column(name = "FEEDBACK_PLATFORM")
    private String platform;

    // OS 버전
    @Column(name = "FEEDBACK_OS_VERSION")
    private String osVersion;

    // 기기 모델명
    @Column(name = "FEEDBACK_DEVICE_MODEL")
    private String deviceModel;

    // 피드백 작성 화면
    @Column(name = "FEEDBACK_SCREEN")
    private String screen;

    /** 관리자 웹에서 상태와 메모를 갱신한다. status가 null이면 기존 상태를 유지한다. */
    public void updateByAdmin(AppFeedbackStatus status, String adminNote) {
        if (status != null) {
            this.status = status;
        }
        this.adminNote = adminNote;
    }

    /** 작성자 본인이 접수 내용을 고친다. category가 null이면 기존 분류를 유지한다. */
    public void updateByMember(AppFeedbackCategory category, String content, String contact) {
        if (category != null) {
            this.category = category;
        }
        this.content = content;
        this.contact = contact;
    }

    /**
     * 작성자가 손댈 수 있는 상태인지 확인한다. 관리자가 확인중/완료로 옮긴 뒤에는 수정·삭제를 막는다
     * (제보의 {@code ShelterInfoAppReport#verifyPending()}과 같은 취지).
     */
    public void verifyReceived() {
        if (this.status != AppFeedbackStatus.RECEIVED) {
            throw new BadRequestException("접수 상태의 피드백만 수정하거나 삭제할 수 있습니다");
        }
    }

    /** 회원 탈퇴 시 작성자만 끊고 피드백 내용은 남긴다. */
    public void detachMember() {
        this.memberId = null;
    }
}
