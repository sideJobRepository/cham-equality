package com.chamapi.disaster.entity;

import com.chamapi.common.entity.DateSuperClass;
import com.chamapi.disaster.enums.EmergencyStep;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import static jakarta.persistence.GenerationType.IDENTITY;

@Table(name = "DISASTER_MESSAGE")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
public class DisasterMessage extends DateSuperClass {

    @Id
    @Column(name = "DISASTER_MESSAGE_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    // 재난안전데이터 일련번호
    @Column(name = "DISASTER_MESSAGE_SN")
    private Long sn;

    @Column(name = "DISASTER_MESSAGE_CONT", columnDefinition = "TEXT")
    private String content;

    @Column(name = "DISASTER_MESSAGE_REGION_NAME")
    private String regionName;

    @Column(name = "DISASTER_MESSAGE_EMERGENCY_STEP")
    @Enumerated(EnumType.STRING)
    private EmergencyStep emergencyStep;

    // 외부 DST_SE_NM 값이 열려 있어 String 유지 (산불/화재/수도/기타 등)
    @Column(name = "DISASTER_MESSAGE_CATEGORY")
    private String category;

    @Column(name = "DISASTER_MESSAGE_ISSUE_DATE")
    private LocalDateTime issuedAt;

    public DisasterMessage(Long id, Long sn, String content, String regionName, EmergencyStep emergencyStep, String category, LocalDateTime issuedAt) {
        this.id = id;
        this.sn = sn;
        this.content = content;
        this.regionName = regionName;
        this.emergencyStep = emergencyStep;
        this.category = category;
        this.issuedAt = issuedAt;
    }
}
