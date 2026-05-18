package com.chamapi.disaster.client;

import com.chamapi.disaster.config.SafetyDataProperties;
import com.chamapi.disaster.dto.external.SafetyDataItem;
import com.chamapi.disaster.dto.external.SafetyDataResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@Slf4j
public class SafetyDataClient {

    private static final DateTimeFormatter CRT_DT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final RestClient restClient;
    private final SafetyDataProperties properties;

    public SafetyDataClient(@Qualifier("safetyDataRestClient") RestClient restClient, SafetyDataProperties properties) {
        this.restClient = restClient;
        this.properties = properties;
    }

    /**
     * 특정 일자 + 지역 prefix 로 한 페이지 조회.
     * 외부 API 장애 시 빈 Optional 반환 — 호출자는 다음 주기에 재시도.
     */
    public Optional<SafetyDataResponse> fetchPage(LocalDate date, String region, int pageNo) {
        try {
            SafetyDataResponse response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path(properties.getDisasterMessagePath())
                            .queryParam("serviceKey", properties.getKey())
                            .queryParam("returnType", "json")
                            .queryParam("pageNo", pageNo)
                            .queryParam("numOfRows", properties.getPageSize())
                            .queryParam("crtDt", date.format(CRT_DT))
                            .queryParam("rgnNm", region)
                            .build())
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(SafetyDataResponse.class);

            if (response == null) {
                log.warn("safetydata.go.kr empty response date={} region={} pageNo={}", date, region, pageNo);
                return Optional.empty();
            }
            if (!response.isSuccess()) {
                log.warn("safetydata.go.kr error code={} msg={} date={} region={}",
                        response.header() == null ? null : response.header().resultCode(),
                        response.header() == null ? null : response.header().resultMsg(),
                        date, region);
                return Optional.empty();
            }
            return Optional.of(response);
        } catch (RestClientException e) {
            log.warn("safetydata.go.kr call failed date={} region={} pageNo={} message={}",
                    date, region, pageNo, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * 페이지를 순회하며 해당 일자/지역의 전체 항목을 수집.
     * 안전장치: 최대 maxPages 까지만 순회.
     */
    public List<SafetyDataItem> fetchAll(LocalDate date, String region, int maxPages) {
        List<SafetyDataItem> result = new ArrayList<>();
        for (int pageNo = 1; pageNo <= maxPages; pageNo++) {
            Optional<SafetyDataResponse> maybe = fetchPage(date, region, pageNo);
            if (maybe.isEmpty()) break;
            SafetyDataResponse response = maybe.get();
            if (response.body() == null || response.body().isEmpty()) break;
            result.addAll(response.body());
            int fetched = pageNo * properties.getPageSize();
            Integer total = response.totalCount();
            if (total == null || fetched >= total) break;
        }
        return result;
    }
}
