package com.chamapi.admin.service;

import com.chamapi.admin.dto.request.AdminShelterCreateRequest;
import com.chamapi.admin.dto.request.AdminShelterUpdateRequest;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.geocoding.dto.GeocodingResponse;
import com.chamapi.geocoding.service.GeocodingService;
import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.enums.ShelterSurveyStatus;
import com.chamapi.shelter.repository.PlaceRepository;
import com.chamapi.shelter.repository.ShelterRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;

/**
 * 관리자만 편집할 수 있는 대피소 필드(시설명/건축년도/대피소타입)의 갱신 서비스.
 * 시민 제보 흐름은 이 필드들을 건드리지 않으며, 관리자가 직접 수정해야만 변경된다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminShelterService {

    private final ShelterRepository shelterRepository;
    private final PlaceRepository placeRepository;
    private final GeocodingService geocodingService;
    private final EntityManager entityManager;

    /**
     * 대피소 추가. 관리자가 입력한 평평한 파라미터를 물리적 장소({@link Place})와
     * 대피소 레코드({@link Shelter})로 분배해 함께 생성한다(1:1로 붙는 새 place를 만든다).
     * name/englishName/description은 두 엔티티에 공통으로 채운다.
     * 위도/경도는 입력받지 않고 주소를 지오코딩(응답 x=경도, y=위도)해 채운다.
     * surveyStatus는 신규 대피소이므로 {@code NOT_INVESTIGATED}로 시작한다.
     *
     * @return 생성된 대피소 ID
     */
    @Transactional
    public Long createShelter(AdminShelterCreateRequest request) {
        if (!StringUtils.hasText(request.name())) {
            throw new BadRequestException("대피소 이름은 필수입니다.");
        }

        String query = StringUtils.hasText(request.address()) ? request.address() : request.oldAddress();
        if (!StringUtils.hasText(query)) {
            throw new BadRequestException("주소는 필수입니다.");
        }
        GeocodingResponse.Address coordinate = geocodingService.getCoordinate(query);
        BigDecimal latitude = new BigDecimal(coordinate.y());
        BigDecimal longitude = new BigDecimal(coordinate.x());

        Region region = request.regionId() == null
                ? null
                : entityManager.getReference(Region.class, request.regionId());

        Place place = placeRepository.save(Place.createForShelter(
                region,
                request.name(),
                request.englishName(),
                request.address(),
                request.oldAddress(),
                request.englishAddress(),
                request.description(),
                latitude,
                longitude
        ));

        Shelter shelter = Shelter.builder()
                .place(place)
                .name(request.name())
                .englishName(request.englishName())
                .latitude(latitude)
                .longitude(longitude)
                .area(request.area())
                .capacity(request.capacity())
                .shelterType(request.shelterType())
                .builtYear(request.builtYear())
                .safetyGrade(request.safetyGrade())
                .description(request.description())
                .managingAuthorityName(request.managingAuthorityName())
                .managingAuthorityTelNo(request.managingAuthorityTelNo())
                .surveyStatus(ShelterSurveyStatus.NOT_INVESTIGATED)
                .build();

        return shelterRepository.save(shelter).getId();
    }

    @Transactional
    public void updateAdminEditableFields(Long shelterId, AdminShelterUpdateRequest request) {
        Shelter shelter = shelterRepository.findById(shelterId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대피소 ID: " + shelterId));
        shelter.updateAdminEditableFields(
                request.name(),
                request.builtYear(),
                request.shelterType(),
                request.safetyGrade()
        );
    }
}
