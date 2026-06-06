package com.chamapi.shelter.entity;

import com.chamapi.common.entity.DateSuperClass;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

import static jakarta.persistence.GenerationType.IDENTITY;

@Table(name = "PLACE")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Place extends DateSuperClass {

    // 장소 ID
    @Id
    @Column(name = "PLACE_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    // 장소명
    @Column(name = "PLACE_NAME", nullable = false)
    private String name;

    // 장소 도로명주소
    @Column(name = "PLACE_ADDRESS")
    private String address;

    // 장소 지번주소
    @Column(name = "PLACE_OLD_ADDRESS")
    private String oldAddress;

    // 장소 상세 설명
    @Column(name = "PLACE_DESCRIPTION", columnDefinition = "TEXT")
    private String description;

    // 장소 위도
    @Column(name = "PLACE_LATITUDE", precision = 10, scale = 8)
    private BigDecimal latitude;

    // 장소 경도
    @Column(name = "PLACE_LONGITUDE", precision = 11, scale = 8)
    private BigDecimal longitude;
}
