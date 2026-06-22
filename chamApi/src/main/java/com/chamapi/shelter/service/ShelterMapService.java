package com.chamapi.shelter.service;

import com.chamapi.file.dto.response.FileViewResponse;
import com.chamapi.file.service.S3FileService;
import com.chamapi.shelter.dto.query.ShelterSearchCondition;
import com.chamapi.shelter.dto.response.*;
import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterImage;
import com.chamapi.shelter.enums.AccessibilityFeature;
import com.chamapi.shelter.repository.ShelterQueryRepositoryImpl;
import com.chamapi.shelter.repository.ShelterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static java.util.stream.Collectors.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShelterMapService {

    private final ShelterRepository shelterRepository;
    private final S3FileService fileService;

    public ShelterAggregateResponse aggregate(ShelterSearchCondition cond, List<AccessibilityFeature> accessibilityFeatures) {
        List<Shelter> shelters = shelterRepository.searchByCondition(cond);

        Map<Long, PlaceMapResponse> placeMap = toPlaceResponseMap(shelters, accessibilityFeatures);
        RegionLevelsResponse regionSummaries = toRegionLevelResponse(shelters);

        return new ShelterAggregateResponse(placeMap, regionSummaries);
    }

    private Map<Long, PlaceMapResponse> toPlaceResponseMap(List<Shelter> shelters, List<AccessibilityFeature> accessibilityFeatures) {
        List<Long> shelterIds = shelters.stream().map(Shelter::getId).toList();
        Map<Long, List<ShelterMapImageResponse>> shelterImagesByShelterId = shelterRepository.findImagesGroupedByShelterId(shelterIds)
                .entrySet()
                .stream()
                .collect(toMap(Map.Entry::getKey, entry -> entry.getValue().stream()
                        .map(shelterImage -> {
                            FileViewResponse fileForView = fileService.getFileForView(shelterImage.getFileId());
                            return new ShelterMapImageResponse(shelterImage.getCategory(), fileForView.getUrl());
                        })
                        .toList()
                ));

        Map<Long, List<ShelterMapResponse>> sheltersByPlaceId = shelters.stream()
                .filter(s -> Objects.nonNull(s.getPlace()))
                .map(s -> ShelterMapResponse.fromDomain(s, accessibilityFeatures, shelterImagesByShelterId.getOrDefault(s.getId(),List.of())))
                .collect(groupingBy(ShelterMapResponse::placeId));

        return shelters.stream()
                .map(Shelter::getPlace)
                .filter(Objects::nonNull)
                .collect(toMap(
                        Place::getId,
                        p -> PlaceMapResponse.fromDomain(p, sheltersByPlaceId.getOrDefault(p.getId(), List.of())),
                        (existing, duplicate) -> existing
                ));
    }

    private RegionLevelsResponse toRegionLevelResponse(List<Shelter> shelters) {
        return RegionLevelsResponse.builder()
                .depth0(summarizeRegionsAtDepth(0, shelters))
                .depth1(summarizeRegionsAtDepth(1, shelters))
                .depth2(summarizeRegionsAtDepth(2, shelters))
                .build();
    }

    private List<RegionSummaryDto> summarizeRegionsAtDepth(int depth, List<Shelter> shelters) {
        Map<Region, Long> regionCount = shelters.stream()
                .map(Shelter::getPlace)
                .filter(Objects::nonNull)
                .map(Place::getRegion)
                .filter(Objects::nonNull)
                .collect(groupingBy(
                                r -> r.getAncestorAtDepth(depth),
                                counting()
                        )
                );

        return regionCount.keySet().stream()
                .map(r -> RegionSummaryDto.fromDomain(r, regionCount.get(r).intValue()))
                .toList();
    }

}
