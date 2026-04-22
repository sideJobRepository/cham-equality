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

/**
 * 시민 공개 대피소 조회 서비스.
 * 대피소 본문 + 대피소별 PENDING 신고 건수를 한 번의 응답에 합쳐 돌려준다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShelterService {

    private final ShelterRepository shelterRepository;
    private final ShelterInfoReportRepository shelterInfoReportRepository;

    /**
     * 대피소 페이지 조회 + 각 대피소의 PENDING 신고 건수를 주입.
     * 신고 건수는 페이지 안의 shelterId 집합에 대해 단일 쿼리({@code IN})로 집계해 N+1을 피한다.
     */
    public PageResponse<ShelterListResponse> findShelters(String keyword, Pageable pageable) {
        Page<Shelter> page = shelterRepository.search(keyword, pageable);
        List<Long> shelterIds = page.getContent().stream().map(Shelter::getId).toList();

        // shelterId → PENDING 개수. 결과에 없는 shelterId는 0으로 취급한다.
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
