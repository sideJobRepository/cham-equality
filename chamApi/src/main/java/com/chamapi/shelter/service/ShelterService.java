package com.chamapi.shelter.service;

import com.chamapi.common.dto.PageResponse;
import com.chamapi.shelter.dto.response.ShelterListResponse;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;
import com.chamapi.shelter.repository.ShelterInfoReportRepository;
import com.chamapi.shelter.repository.ShelterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShelterService {

    private final ShelterRepository shelterRepository;
    private final ShelterInfoReportRepository shelterInfoReportRepository;

    public PageResponse<ShelterListResponse> findShelters(String keyword, Pageable pageable) {
        Page<Shelter> page = shelterRepository.search(keyword, pageable);
        List<Long> shelterIds = page.getContent().stream().map(Shelter::getId).toList();

        Map<Long, Integer> pendingCountByShelterId = shelterIds.isEmpty()
                ? Map.of()
                : shelterInfoReportRepository
                        .countByShelterIdInAndRequestStatus(shelterIds, ShelterInfoReportStatus.PENDING)
                        .stream()
                        .collect(Collectors.toMap(
                                row -> (Long) row[0],
                                row -> ((Long) row[1]).intValue()
                        ));

        return PageResponse.from(page.map(s ->
                ShelterListResponse.from(s, pendingCountByShelterId.getOrDefault(s.getId(), 0))
        ));
    }
}
