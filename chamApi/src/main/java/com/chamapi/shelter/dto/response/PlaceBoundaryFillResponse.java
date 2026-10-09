package com.chamapi.shelter.dto.response;

/**
 * 경계 일괄 채우기 결과. {@code remaining}이 0이 될 때까지 다시 호출하면 된다.
 * {@code failed}는 통신 오류로 다음 호출 때 다시 시도되는 건수다.
 */
public record PlaceBoundaryFillResponse(int processed, int updated, int notFound, int failed, long remaining) {
}
