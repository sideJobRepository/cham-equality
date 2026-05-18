package com.chamapi.disaster.service;

import com.chamapi.disaster.dto.response.ActiveDisasterResponse;
import com.chamapi.disaster.dto.response.DisasterMessageResponse;

public interface DisasterMessageService {

    /** 메인 홈 배너용. 최근 6시간 내 지역 위급/긴급 메시지 중 가장 최근 1건. 없으면 inactive. */
    ActiveDisasterResponse findActive();

    /** 재난문자 상세보기. 없는 id 면 BadRequestException. */
    DisasterMessageResponse findOne(Long id);
}
