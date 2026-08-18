package com.chamapi.shelter.repository;

import com.chamapi.shelter.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegionRepository extends JpaRepository<Region, Long> {

    List<Region> findByRegionDepthOrderByRegionNameAsc(int regionDepth);

    List<Region> findByRegionDepthAndParent_RegionIdOrderByRegionNameAsc(int regionDepth, Long parentId);

    // depth 2(동) 지역을 depth 0/1/2 이름으로 조회 (parent = depth1, parent.parent = depth0)
    Optional<Region> findByRegionDepthAndRegionNameAndParent_RegionNameAndParent_Parent_RegionName(
            int regionDepth, String regionName, String parentRegionName, String parentParentRegionName);
}
