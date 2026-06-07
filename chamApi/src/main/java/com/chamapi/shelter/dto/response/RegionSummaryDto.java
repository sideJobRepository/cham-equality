package com.chamapi.shelter.dto.response;

import com.chamapi.shelter.entity.Region;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayDeque;
import java.util.Deque;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegionSummaryDto {

    private Long   regionId;   // 해당 레벨의 REGION_ID (city/gu/dong 중 하나)
    private Long parentId; //부모 ID 추가
    private int    depth;      // 0=시/도, 1=구/군, 2=동
    private String path;       // "대전", "대전 서구", "대전 동구 신하동"
    private BigDecimal x;          // 해당 레벨(region)의 X
    private BigDecimal y;          // 해당 레벨(region)의 Y
    private int    count;      // 총 건수(해당 레벨에 귀속된 카드사용 수)

    public void inc() { this.count++; }

    public static String buildPath(Region r) {
        Deque<String> parts = new ArrayDeque<>();
        while (r != null) {
            parts.addFirst(r.getRegionName());
            r = r.getParent();
        }
        return String.join(" ", parts);
    }

    public static RegionSummaryDto toSummarySkeleton(Region r) {
        return RegionSummaryDto.builder()
                .regionId(r.getRegionId())
                .parentId(r.getParent() != null ? r.getParent().getRegionId() : null)
                .depth(r.getRegionDepth())
                .path(buildPath(r))
                .x(r.getRegionLongitude())
                .y(r.getRegionLatitude())
                .count(0)
                .build();
    }


}
