package com.chamapi.shelter.repository.query;

import com.chamapi.shelter.entity.Place;

import java.util.List;

public interface PlaceQueryRepository {

    /** 부지 경계를 아직 조회하지 않은(PNU 가 비어 있는) 좌표 있는 장소. id 순. */
    List<Place> findBoundaryPending(int limit);

    long countBoundaryPending();
}
