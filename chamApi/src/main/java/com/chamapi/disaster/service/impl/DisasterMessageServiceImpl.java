package com.chamapi.disaster.service.impl;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.disaster.config.SafetyDataProperties;
import com.chamapi.disaster.dto.response.DisasterMessageResponse;
import com.chamapi.disaster.entity.DisasterMessage;
import com.chamapi.disaster.repository.DisasterMessageRepository;
import com.chamapi.disaster.service.DisasterMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class DisasterMessageServiceImpl implements DisasterMessageService {

    private static final int LATEST_LIMIT = 5;

    private final DisasterMessageRepository repository;
    private final SafetyDataProperties properties;

    @Override
    public List<DisasterMessageResponse> findLatest() {
        List<DisasterMessage> latest = repository.findLatest(properties.getRegion(), LATEST_LIMIT);
        return latest.stream()
                .map(DisasterMessageResponse::from)
                .toList();
    }

    @Override
    public DisasterMessageResponse findOne(Long id) {
        DisasterMessage m = repository.findById(id).orElseThrow(() -> new BadRequestException("재난문자를 찾을 수 없습니다."));
        return DisasterMessageResponse.from(m);
    }
}
