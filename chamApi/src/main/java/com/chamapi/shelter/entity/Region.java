package com.chamapi.shelter.entity;

import com.chamapi.multilingual.entity.Language;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "REGION")
@Getter
@NoArgsConstructor
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "REGION_ID")
    private Long regionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PARENT_REGION_ID")
    private Region parent;

    @Column(name = "REGION_NAME")
    private String regionName;

    @Column(name = "REGION_TYPE")
    private String regionType;

    @Column(name = "REGION_DEPTH")
    private int regionDepth;

    @Column(name = "REGION_FULL_NAME")
    private String regionFullName;

    @Column(name = "REGION_FULL_ENGLISH_NAME")
    private String regionFullEnglishName;

    @Column(name = "REGION_LONGITUDE")
    private BigDecimal regionLongitude;

    @Column(name = "REGION_LATITUDE")
    private BigDecimal regionLatitude;

    public Region(Region parent, String regionName, String regionType, Integer regionDepth, BigDecimal regionLongitude, BigDecimal regionLatitude) {
        this.parent = parent;
        this.regionName = regionName;
        this.regionType = regionType;
        this.regionDepth = regionDepth;
        this.regionLongitude = regionLongitude;
        this.regionLatitude = regionLatitude;
    }

    public Long getParentId(){
        return getParent() == null ? null : getParent().getRegionId();
    }

    public Region getAncestorAtDepth(int depth){
        if(this.regionDepth < depth)
            throw new IllegalArgumentException(
                    "요청한 depth(" + depth + ")가 현재 region의 depth(" + this.regionDepth + ")보다 깊습니다");

        Region current = this;
        while(current != null){
            if(current.getRegionDepth() == depth)
                return current;
            current = current.getParent();
        }
        return null;
    }

    public String getFullNameByLanguage(Language lang){
        if(lang == Language.KO)
            return regionFullName;

        return regionFullEnglishName;
    }
}
