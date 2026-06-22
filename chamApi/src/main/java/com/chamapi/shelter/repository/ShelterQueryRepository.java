package com.chamapi.shelter.repository;

import com.chamapi.shelter.dto.query.ShelterSearchCondition;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterImage;

import java.util.List;
import java.util.Map;

public interface ShelterQueryRepository {

    List<Shelter> searchByCondition(ShelterSearchCondition condition);

    Map<Long, List<ShelterImage>> findImagesGroupedByShelterId(List<Long> shelterIds);
}
