package com.chamapi.shelter.entity;

import com.chamapi.common.entity.DateSuperClass;
import com.chamapi.shelter.enums.AccessibilityFeature;
import com.chamapi.shelter.enums.AccessibilityMatchStatus;
import com.chamapi.shelter.enums.ShelterSurveyStatus;
import com.chamapi.shelter.enums.ShelterType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

import static jakarta.persistence.GenerationType.IDENTITY;
import static org.springframework.util.CollectionUtils.*;

@Table(name = "SHELTER")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Shelter extends DateSuperClass {

    // 대피소 ID
    @Id
    @Column(name = "SHELTER_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PLACE_ID")
    private Place place;

    // 대피소 이름
    @Column(name = "SHELTER_NAME")
    private String name;
    
    // 대피소 영문 이름
    @Column(name = "SHELTER_ENGLISH_NAME")
    private String englishName;

    // 대피소 위도
    @Column(name = "SHELTER_LATITUDE", precision = 10, scale = 8)
    private BigDecimal latitude;

    // 대피소 경도
    @Column(name = "SHELTER_LONGITUDE", precision = 11, scale = 8)
    private BigDecimal longitude;

    // 대피소 면적
    @Column(name = "SHELTER_AREA")
    private Integer area;

    // 대피소 수용인원
    @Column(name = "SHELTER_CAPACITY")
    private Integer capacity;

    // 대피소 타입
    @Column(name = "SHELTER_TYPE")
    @Enumerated(EnumType.STRING)
    private ShelterType shelterType;

    // 대피소 건축 연도
    @Column(name = "SHELTER_BUILT_YEAR")
    private Integer builtYear;

    // 대피소 안전 등급
    @Column(name = "SHELTER_SAFETY_GRADE")
    private Integer safetyGrade;

    // 대피소 설명
    @Column(name = "SHELTER_DESCRIPTION", columnDefinition = "TEXT")
    private String description;

    // 대피소 관리 기관 이름
    @Column(name = "SHELTER_MANAGING_AUTHORITY_NAME")
    private String managingAuthorityName;

    // 대피소 관리 기관 전화 번호
    @Column(name = "SHELTER_MANAGING_AUTHORITY_TEL_NO")
    private String managingAuthorityTelNo;

    // 대피소 안내문 언어
    @Column(name = "SHELTER_SIGNAGE_LANGUAGE")
    private String signageLanguage;

    // 대피소 이동약자 편의시설
    @Embedded
    private ShelterAccessibility accessibility;

    // 대피소 조사 상태(시민 제출 가능 여부 게이트)
    @Column(name = "SHELTER_SURVEY_STATUS")
    @Enumerated(EnumType.STRING)
    private ShelterSurveyStatus surveyStatus;

    public void applyReport(ShelterInfoReport report) {
        if (report.getSignageLanguage() != null) this.signageLanguage = report.getSignageLanguage();
        if (report.getAccessibility() != null) this.accessibility = report.getAccessibility();
        this.surveyStatus = ShelterSurveyStatus.INVESTIGATED;
    }

    public void markReInvestigation() {
        this.surveyStatus = ShelterSurveyStatus.RE_INVESTIGATION;
    }

    public void updateAdminEditableFields(String name, Integer builtYear, ShelterType shelterType, Integer safetyGrade) {
        this.name = name;
        this.builtYear = builtYear;
        this.shelterType = shelterType;
        this.safetyGrade = safetyGrade;
    }

    private static final double EARTH_RADIUS_METERS = 6_371_000;

    // 대권 거리 (Haversine)
    public double distanceTo(BigDecimal y, BigDecimal x) {
        double lat1 = Math.toRadians(this.latitude.doubleValue());
        double lon1 = Math.toRadians(this.longitude.doubleValue());
        double lat2 = Math.toRadians(y.doubleValue());
        double lon2 = Math.toRadians(x.doubleValue());

        double dLat = lat2 - lat1;
        double dLon = lon2 - lon1;
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
    }

    public AccessibilityMatchStatus evaluateAccessibility(List<AccessibilityFeature> accessibilityFeatures) {
        if (isEmpty(accessibilityFeatures)) {
            return AccessibilityMatchStatus.NONE;
        }

        long satisfied = accessibilityFeatures.stream()
                .filter(f -> f.isSatisfiedBy(this))
                .count();

        if (satisfied == accessibilityFeatures.size()) return AccessibilityMatchStatus.ACCESSIBLE;
        if (satisfied == 0) return AccessibilityMatchStatus.INACCESSIBLE;
        return AccessibilityMatchStatus.PARTIAL;
    }
}
