package com.chamapi.dailysafety.service;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.dailysafety.dto.DailySafetySummaryResponse;
import com.chamapi.dailysafety.repository.DailySafetySummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DailySafetyService {

    private final DailySafetySummaryRepository repository;

    public DailySafetySummaryResponse findLatest() {
        return repository.findLatest()
                .map(DailySafetySummaryResponse::from)
                .orElseThrow(() -> new BadRequestException("일일 재난안전 정보 요약을 찾을 수 없습니다."));
    }
}
