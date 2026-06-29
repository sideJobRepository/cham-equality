package com.chamapi.shelter.entity;

import com.chamapi.common.entity.DateSuperClass;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static jakarta.persistence.GenerationType.IDENTITY;

@Table(name = "PLACE")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Place extends DateSuperClass {

    // 장소 ID
    @Id
    @Column(name = "PLACE_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    // 지역 ID
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "REGION_ID")
    private Region region;

    // 장소명
    @Column(name = "PLACE_NAME", nullable = false)
    private String name;

    // 장소 도로명주소
    @Column(name = "PLACE_ADDRESS")
    private String address;

    // 장소 지번주소
    @Column(name = "PLACE_OLD_ADDRESS")
    private String oldAddress;

    // 장소 영문주소
    @Column(name = "PLACE_ENGLISH_ADDRESS")
    @Setter
    private String englishAddress;

    // 장소 상세 설명
    @Column(name = "PLACE_DESCRIPTION", columnDefinition = "TEXT")
    private String description;

    // 장소 위도
    @Column(name = "PLACE_LATITUDE", precision = 10, scale = 8)
    private BigDecimal latitude;

    // 장소 경도
    @Column(name = "PLACE_LONGITUDE", precision = 11, scale = 8)
    private BigDecimal longitude;

    // 장소에 속한 대피소 목록
    @OneToMany(mappedBy = "place", fetch = FetchType.LAZY)
    private List<Shelter> shelters = new ArrayList<>();

    /**
     * 테스트에서 사용함
     */
    @Builder
    private static Place create(Region region,
                                String name,
                                String address,
                                String oldAddress,
                                String description,
                                BigDecimal latitude,
                                BigDecimal longitude) {
        Place place = new Place();
        place.region = region;
        place.name = name;
        place.address = address;
        place.oldAddress = oldAddress;
        place.description = description;
        place.latitude = latitude;
        place.longitude = longitude;
        return place;
    }
}
