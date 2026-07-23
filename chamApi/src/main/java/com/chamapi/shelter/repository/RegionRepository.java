package com.chamapi.shelter.repository;

import com.chamapi.shelter.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegionRepository extends JpaRepository<Region, Long> {

    List<Region> findByRegionDepthOrderByRegionNameAsc(int regionDepth);

    List<Region> findByRegionDepthAndParent_RegionIdOrderByRegionNameAsc(int regionDepth, Long parentId);
}
