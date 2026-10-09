package com.chamapi.shelter.entity;

import com.chamapi.common.entity.DateSuperClass;
import com.chamapi.multilingual.entity.Language;
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

    // 장소 영문명
    @Column(name = "PLACE_ENGLISH_NAME")
    private String englishName;

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

    // 장소 부지 경계(GeoJSON Polygon/MultiPolygon, WGS84 [경도, 위도]). 지도에 면으로 칠할 때 쓴다.
    @Column(name = "PLACE_AREA_GEOJSON", columnDefinition = "MEDIUMTEXT")
    private String areaGeoJson;

    // 경계를 가져온 필지 고유번호(VWorld PNU). 조회했지만 쓸 필지가 없으면 AREA_NOT_FOUND.
    @Column(name = "PLACE_AREA_PNU")
    private String areaPnu;

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

    public static Place createForShelter(Region region,
                                         String name,
                                         String englishName,
                                         String address,
                                         String oldAddress,
                                         String englishAddress,
                                         String description,
                                         BigDecimal latitude,
                                         BigDecimal longitude) {
        Place place = new Place();
        place.region = region;
        place.name = name;
        place.englishName = englishName;
        place.address = address;
        place.oldAddress = oldAddress;
        place.englishAddress = englishAddress;
        place.description = description;
        place.latitude = latitude;
        place.longitude = longitude;
        return place;
    }

    public String getNameByLanguage(Language lang){
        if(lang == Language.KO)
            return name;

        return englishName;
    }

    public String getAddressByLanguage(Language lang){
        if(lang == Language.KO)
            return address;

        return englishAddress;
    }

    public String getOldAddressByLanguage(Language lang){
        if(lang == Language.KO)
            return oldAddress;

        return null;
    }

    /** 조회했지만 쓸 필지가 없을 때 PNU 자리에 남기는 표시. 다음 일괄 채우기에서 다시 조회하지 않는다. */
    public static final String AREA_NOT_FOUND = "NOT_FOUND";

    /** VWorld 에서 받은 필지 경계를 저장한다. */
    public void updateArea(String geoJson, String pnu) {
        this.areaGeoJson = geoJson;
        this.areaPnu = pnu;
    }

    /** 경계를 찾지 못했음을 기록한다(좌표가 도로·하천 위이거나 필지가 없음). */
    public void markAreaNotFound() {
        this.areaGeoJson = null;
        this.areaPnu = AREA_NOT_FOUND;
    }
}
