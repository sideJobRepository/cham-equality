package com.chamapi.shelter.entity;

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
    private Integer regionDepth;

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
}
