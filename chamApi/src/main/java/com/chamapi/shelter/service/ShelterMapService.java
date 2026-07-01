package com.chamapi.shelter.service;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.file.dto.response.FileViewResponse;
import com.chamapi.file.service.S3FileService;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.shelter.dto.query.NearestShelterCondition;
import com.chamapi.shelter.dto.query.ShelterSearchCondition;
import com.chamapi.shelter.dto.response.*;
import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterImage;
import com.chamapi.shelter.enums.AccessibilityFeature;
import com.chamapi.shelter.enums.AccessibilityMatchStatus;
import com.chamapi.shelter.repository.ShelterQueryRepositoryImpl;
import com.chamapi.shelter.repository.ShelterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cglib.core.Local;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static java.util.stream.Collectors.*;
import static org.springframework.util.CollectionUtils.isEmpty;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShelterMapService {

    private final ShelterRepository shelterRepository;
    private final S3FileService fileService;

    public ShelterAggregateResponse aggregate(ShelterSearchCondition cond, List<AccessibilityFeature> accessibilityFeatures, Language lang) {
        List<Shelter> shelters = shelterRepository.searchByCondition(cond);

        Map<Long, PlaceMapResponse> placeMap = toPlaceResponseMap(shelters, accessibilityFeatures, lang);
        RegionLevelsResponse regionSummaries = toRegionLevelResponse(shelters, lang);

        return new ShelterAggregateResponse(placeMap, regionSummaries);
    }

    public ShelterMapResponse getNearest(NearestShelterCondition condition, Language lang) {
        List<AccessibilityFeature> features = condition.accessibilityFeatures();

        Shelter nearest = shelterRepository.findAllWithPlaceAndRegion().stream()
                .filter(s -> Objects.nonNull(s.getLatitude()) && Objects.nonNull(s.getLongitude()))
                .filter(s -> isEmpty(features) || s.evaluateAccessibility(features) == AccessibilityMatchStatus.ACCESSIBLE)
                .min(Comparator.comparingDouble(s -> s.distanceTo(condition.y(), condition.x())))
                .orElseThrow(() -> new BadRequestException("조건에 맞는 대피소를 찾을 수 없습니다"));

        List<ShelterMapImageResponse> images = shelterRepository.findImagesByShelterId(nearest.getId())
                .stream()
                .map(shelterImage -> {
                    FileViewResponse fileForView = fileService.getFileForView(shelterImage.getFileId());
                    return new ShelterMapImageResponse(shelterImage.getCategory(), fileForView.getUrl());
                })
                .toList();

        return ShelterMapResponse.fromDomain(nearest, condition.accessibilityFeatures(), images, lang);
    }

    private Map<Long, PlaceMapResponse> toPlaceResponseMap(List<Shelter> shelters, List<AccessibilityFeature> accessibilityFeatures, Language lang) {
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
                .map(s -> ShelterMapResponse.fromDomain(s, accessibilityFeatures, shelterImagesByShelterId.getOrDefault(s.getId(),List.of()), lang))
                .collect(groupingBy(ShelterMapResponse::placeId));

        return shelters.stream()
                .map(Shelter::getPlace)
                .filter(Objects::nonNull)
                .collect(toMap(
                        Place::getId,
                        p -> PlaceMapResponse.fromDomain(p, sheltersByPlaceId.getOrDefault(p.getId(), List.of()), lang),
                        (existing, duplicate) -> existing
                ));
    }

    private RegionLevelsResponse toRegionLevelResponse(List<Shelter> shelters, Language lang) {
        return RegionLevelsResponse.builder()
                .depth0(summarizeRegionsAtDepth(0, shelters, lang))
                .depth1(summarizeRegionsAtDepth(1, shelters, lang))
                .depth2(summarizeRegionsAtDepth(2, shelters, lang))
                .build();
    }

    private List<RegionSummaryDto> summarizeRegionsAtDepth(int depth, List<Shelter> shelters, Language lang) {
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
                .map(r -> RegionSummaryDto.fromDomain(r, regionCount.get(r).intValue(), lang))
                .toList();
    }

}
