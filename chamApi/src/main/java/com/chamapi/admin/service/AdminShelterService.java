package com.chamapi.admin.service;

import com.chamapi.admin.dto.request.AdminShelterUpdateRequest;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.repository.ShelterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자만 편집할 수 있는 대피소 필드(시설명/건축년도/대피소타입)의 갱신 서비스.
 * 시민 제보 흐름은 이 필드들을 건드리지 않으며, 관리자가 직접 수정해야만 변경된다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminShelterService {

    private final ShelterRepository shelterRepository;

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
