package com.chamapi.shelter.dto.response;

/**
 * 장소 부지 경계. {@code geoJson}은 GeoJSON geometry(Polygon/MultiPolygon, 좌표는 [경도, 위도]) 문자열이며,
 * 경계가 없으면 null 이다. 앱 지도가 선택한 장소를 면으로 칠할 때 쓴다.
 */
public record PlaceBoundaryResponse(Long placeId, String geoJson) {
}
