package com.chamapi.manual.service;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.manual.dto.ManualListResponse;
import com.chamapi.manual.dto.ManualResponse;
import com.chamapi.manual.repository.ManualRepository;
import com.chamapi.multilingual.entity.Language;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ManualService {

    private final ManualRepository manualRepository;

    public List<ManualListResponse> getManuals(Language lang) {
        return manualRepository.findByLanguage(lang).stream()
                .map(ManualListResponse::from)
                .toList();
    }

    public ManualResponse getManual(Long id) {
        return ManualResponse.from(manualRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("매뉴얼을 찾을 수 없습니다. id = " + id)));
    }
}
