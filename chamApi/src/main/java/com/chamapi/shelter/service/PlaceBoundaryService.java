package com.chamapi.shelter.service;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.shelter.client.VWorldParcelClient;
import com.chamapi.shelter.client.VWorldParcelClient.Parcel;
import com.chamapi.shelter.dto.response.PlaceBoundaryFillResponse;
import com.chamapi.shelter.dto.response.PlaceBoundaryResponse;
import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.repository.PlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 장소 부지 경계(필지 폴리곤). 관리자가 일괄로 VWorld 에서 채우고, 앱은 선택한 장소 하나씩 받아 지도에 칠한다.
 *
 * <p>경계는 장소 좌표가 속한 필지 하나다. 여러 필지로 된 부지(학교 등)는 마커가 찍힌 필지만 칠해진다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PlaceBoundaryService {

    private static final int MAX_FILL_LIMIT = 500;

    private final PlaceRepository placeRepository;
    private final VWorldParcelClient vWorldParcelClient;

    public PlaceBoundaryResponse getBoundary(Long placeId) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new BadRequestException("장소를 찾을 수 없습니다."));
        return new PlaceBoundaryResponse(place.getId(), place.getAreaGeoJson());
    }

    /**
     * 아직 조회하지 않은 장소 중 {@code limit}개의 경계를 채운다. 통신 오류가 난 장소는 그대로 두어 다음 호출에서 다시 시도한다.
     */
    @Transactional
    public PlaceBoundaryFillResponse fillMissing(int limit) {
        if (!vWorldParcelClient.isEnabled()) {
            throw new BadRequestException("VWorld 키가 설정되지 않았습니다.");
        }
        int size = Math.max(1, Math.min(limit, MAX_FILL_LIMIT));
        List<Place> places = placeRepository.findBoundaryPending(size);

        int updated = 0;
        int notFound = 0;
        int failed = 0;
        for (Place place : places) {
            try {
                Optional<Parcel> parcel = vWorldParcelClient.findParcel(place.getLatitude(), place.getLongitude());
                if (parcel.isPresent()) {
                    place.updateArea(parcel.get().geoJson(), parcel.get().pnu());
                    updated++;
                } else {
                    place.markAreaNotFound();
                    notFound++;
                }
            } catch (RuntimeException e) {
                failed++;
                log.warn("place boundary fetch failed placeId={} reason={}", place.getId(), e.getMessage());
            }
        }
        // 같은 트랜잭션의 카운트 쿼리 직전에 위 변경이 flush 되므로 이미 처리한 건은 빠진 값이 나온다.
        long remaining = placeRepository.countBoundaryPending();
        return new PlaceBoundaryFillResponse(places.size(), updated, notFound, failed, remaining);
    }
}
