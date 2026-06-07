package com.chamapi.shelter.service;

import com.chamapi.shelter.dto.response.*;
import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.repository.ShelterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import static java.util.stream.Collectors.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShelterMapService {

    private final ShelterRepository shelterRepository;

    // TODO: 검색
    public ShelterAggregateResponse aggregate() {

        List<Shelter> shelters = shelterRepository.findAllWithPlaceAndRegion();

        Map<Long, PlaceResponse> placeMap = toPlaceResponseMap(shelters);
        RegionLevelsResponse regionSummaries = toRegionLevelResponse(shelters);

        return new ShelterAggregateResponse(placeMap, regionSummaries);
    }

    private Map<Long, PlaceResponse> toPlaceResponseMap(List<Shelter> shelters) {
        Map<Long, List<Shelter>> sheltersByPlaceId = shelters.stream()
                .filter(s -> Objects.nonNull(s.getPlace()))
                .collect(groupingBy(s -> s.getPlace().getId()));

        return shelters.stream()
                .map(Shelter::getPlace)
                .filter(Objects::nonNull)
                .collect(toMap(
                        Place::getId,
                        p -> PlaceResponse.fromDomain(p, sheltersByPlaceId.getOrDefault(p.getId(), List.of())),
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
