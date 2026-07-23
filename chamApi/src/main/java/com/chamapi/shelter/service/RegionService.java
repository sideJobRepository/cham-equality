package com.chamapi.shelter.service;

import com.chamapi.shelter.dto.response.RegionOptionResponse;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RegionService {

    private final RegionRepository regionRepository;

    public List<RegionOptionResponse> getRegionsByDepth(int depth, Long parentId) {
        List<Region> regions = (parentId == null)
                ? regionRepository.findByRegionDepthOrderByRegionNameAsc(depth)
                : regionRepository.findByRegionDepthAndParent_RegionIdOrderByRegionNameAsc(depth, parentId);

        return regions.stream()
                .map(RegionOptionResponse::fromDomain)
                .toList();
    }
}
