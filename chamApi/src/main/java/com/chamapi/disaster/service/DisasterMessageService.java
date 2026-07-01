package com.chamapi.disaster.service;

import com.chamapi.disaster.dto.response.DisasterMessageResponse;

import java.util.List;

public interface DisasterMessageService {

    /** 메인 홈 배너용. 대전 지역 재난문자 중 최신 5건을 발령시각 내림차순으로. 없으면 빈 리스트. */
    List<DisasterMessageResponse> findLatest();

    /** 재난문자 상세보기. 없는 id 면 BadRequestException. */
    DisasterMessageResponse findOne(Long id);
}
