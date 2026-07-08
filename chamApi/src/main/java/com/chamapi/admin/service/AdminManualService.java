package com.chamapi.admin.service;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.manual.dto.ManualCreateRequest;
import com.chamapi.manual.dto.ManualListResponse;
import com.chamapi.manual.dto.ManualUpdateRequest;
import com.chamapi.manual.entity.Manual;
import com.chamapi.manual.repository.ManualRepository;
import com.chamapi.multilingual.entity.Language;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminManualService {

    private final ManualRepository manualRepository;

    /** 전체조회 (언어 구분 없이 모든 매뉴얼). 최신순. */
    public List<ManualListResponse> getAllManuals() {
        return manualRepository.findAllByOrderByIdDesc().stream()
                .map(ManualListResponse::from)
                .toList();
    }

    @Transactional
    public Long createManual(ManualCreateRequest request) {
        Manual manual = manualRepository.save(Manual.builder()
                .language(Language.fromCode(request.language()))
                .title(request.title())
                .content(request.content())
                .build());

        return manual.getId();
    }

    @Transactional
    public void updateManual(Long id, ManualUpdateRequest request) {
        Manual manual = findById(id);
        manual.update(Language.fromCode(request.language()), request.title(), request.content());
    }

    @Transactional
    public void deleteManual(Long id) {
        manualRepository.deleteById(id);
    }

    private Manual findById(Long id) {
        return manualRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("매뉴얼을 찾을 수 없습니다. id = " + id));
    }
}
