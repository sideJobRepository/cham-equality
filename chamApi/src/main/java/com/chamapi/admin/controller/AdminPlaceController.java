package com.chamapi.admin.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.shelter.dto.response.PlaceBoundaryFillResponse;
import com.chamapi.shelter.service.PlaceBoundaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 관리자 장소 경계 채우기. VWorld 를 장소마다 한 번씩 호출하므로 한 번에 {@code limit}개씩 나눠 돌리고,
 * 응답의 {@code remaining}이 0이 될 때까지 다시 부른다.
 * {@code /api/admin/**}라 {@code AdminAuthInterceptor}가 {@code X-Admin-Password}를 요구한다.
 */
@RestController
@RequestMapping("/api/admin/places")
@RequiredArgsConstructor
public class AdminPlaceController {

    private final PlaceBoundaryService placeBoundaryService;

    @PostMapping("/boundaries/fill")
    public ApiResponse<PlaceBoundaryFillResponse> fillBoundaries(@RequestParam(defaultValue = "100") int limit) {
        return ApiResponse.ok(placeBoundaryService.fillMissing(limit));
    }
}
