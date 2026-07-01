package com.chamapi.disaster.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.disaster.dto.response.DisasterMessageResponse;
import com.chamapi.disaster.service.DisasterMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 시민 공개용 재난문자 API. 메인 홈 배너 및 상세보기에 사용.
 * 적재는 주기적으로 누적하되, 외부 노출은 "대전 최신 5건"
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DisasterMessageController {

    private final DisasterMessageService disasterMessageService;

    /** 대전 지역 재난문자 최신 5건 (발령시각 내림차순). 메인 홈 배너용. */
    @GetMapping("/disaster-messages/latest")
    public ApiResponse<List<DisasterMessageResponse>> latest() {
        return new ApiResponse<>(200, true, disasterMessageService.findLatest());
    }
}
