package com.chamapi.shelter.dto.response;

import com.chamapi.shelter.entity.Region;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RegionOptionResponse {

    private Long regionId;
    private Long parentId;
    private int depth;
    private String name;

    public static RegionOptionResponse fromDomain(Region region) {
        return RegionOptionResponse.builder()
                .regionId(region.getRegionId())
                .parentId(region.getParentId())
                .depth(region.getRegionDepth())
                .name(region.getRegionName())
                .build();
    }
}
