package com.chamapi.disaster.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.disaster.dto.response.ActiveDisasterResponse;
import com.chamapi.disaster.dto.response.DisasterMessageResponse;
import com.chamapi.disaster.service.DisasterMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 시민 공개용 재난문자 API. 메인 홈 배너 및 상세보기에 사용.
 * 적재는 주기적으로 누적하되, 외부 노출은 "현재 활성 1건"
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DisasterMessageController {

    private final DisasterMessageService disasterMessageService;

    /** 현재 활성 위급/긴급 재난문자 (없으면 active=false). 메인 홈 배너용. */
    @GetMapping("/disaster-messages/active")
    public ApiResponse<ActiveDisasterResponse> active() {
        return new ApiResponse<>(200, true, disasterMessageService.findActive());
    }
}
