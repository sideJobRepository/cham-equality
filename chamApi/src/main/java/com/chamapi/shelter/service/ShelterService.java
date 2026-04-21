package com.chamapi.shelter.service;

import com.chamapi.common.dto.PageResponse;
import com.chamapi.shelter.dto.response.ShelterListResponse;
import com.chamapi.shelter.repository.ShelterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShelterService {

    private final ShelterRepository shelterRepository;

    public PageResponse<ShelterListResponse> findShelters(Pageable pageable) {
        return PageResponse.from(
                shelterRepository.findAll(pageable)
                        .map(ShelterListResponse::from)
        );
    }
}
