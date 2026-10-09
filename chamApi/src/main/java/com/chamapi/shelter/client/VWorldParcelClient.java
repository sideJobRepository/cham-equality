package com.chamapi.shelter.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Optional;
import java.util.Set;

/**
 * VWorld 연속지적도(LP_PA_CBND_BUBUN)에서 한 좌표가 속한 필지의 경계를 가져온다.
 *
 * <p>VWorld 키는 발급 시 등록한 서비스 도메인을 요청마다 {@code domain}으로 같이 보내야 통과한다
 * (안 보내면 INCORRECT_KEY). 그래서 로컬에서도 운영 도메인 값을 쓴다.
 * 키가 없으면 비활성으로 부팅하고, 조회는 빈 결과를 돌려준다.
 */
@Component
@Slf4j
public class VWorldParcelClient {

    private static final String BASE_URL = "https://api.vworld.kr";
    private static final Duration TIMEOUT = Duration.ofSeconds(10);
    // 지번 끝 글자는 지목 약어다. 마커 좌표가 살짝 어긋나 도로·하천·구거·철도에 찍히면 부지가 아니므로 버린다.
    private static final Set<String> SKIP_LAND_CATEGORIES = Set.of("도", "천", "구", "철");

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String key;
    private final String domain;

    public VWorldParcelClient(
            @Value("${vworld.key:}") String key,
            @Value("${vworld.domain:cham-monimap.com}") String domain
    ) {
        this.key = key == null ? "" : key.trim();
        this.domain = domain;
        this.objectMapper = new ObjectMapper();
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(TIMEOUT);
        this.restClient = RestClient.builder().baseUrl(BASE_URL).requestFactory(factory).build();
    }

    public boolean isEnabled() {
        return !key.isEmpty();
    }

    /** 좌표가 속한 필지. 없거나 도로·하천 등 부지가 아닌 필지면 비어 있다. 통신 오류는 예외로 던진다. */
    public Optional<Parcel> findParcel(BigDecimal latitude, BigDecimal longitude) {
        if (!isEnabled()) {
            return Optional.empty();
        }
        String body = restClient.get()
                .uri(builder -> builder.path("/req/data")
                        .queryParam("service", "data")
                        .queryParam("request", "GetFeature")
                        .queryParam("data", "LP_PA_CBND_BUBUN")
                        .queryParam("key", key)
                        .queryParam("domain", domain)
                        .queryParam("geomFilter", "POINT(" + longitude.toPlainString() + " " + latitude.toPlainString() + ")")
                        .queryParam("geometry", "true")
                        .queryParam("attribute", "true")
                        .queryParam("crs", "EPSG:4326")
                        .queryParam("format", "json")
                        .queryParam("size", "1")
                        .build())
                .retrieve()
                .body(String.class);
        return parse(body);
    }

    Optional<Parcel> parse(String body) {
        try {
            JsonNode response = objectMapper.readTree(body).path("response");
            String status = response.path("status").asText();
            if ("NOT_FOUND".equals(status)) {
                return Optional.empty();
            }
            if (!"OK".equals(status)) {
                throw new IllegalStateException("VWorld 오류: " + response.path("error").path("code").asText(status));
            }
            JsonNode feature = response.path("result").path("featureCollection").path("features").path(0);
            JsonNode geometry = feature.path("geometry");
            if (feature.isMissingNode() || geometry.isMissingNode()) {
                return Optional.empty();
            }
            String jibun = feature.path("properties").path("jibun").asText("");
            String landCategory = jibun.isEmpty() ? "" : jibun.substring(jibun.length() - 1);
            if (SKIP_LAND_CATEGORIES.contains(landCategory)) {
                return Optional.empty();
            }
            return Optional.of(new Parcel(
                    feature.path("properties").path("pnu").asText(null),
                    objectMapper.writeValueAsString(geometry)));
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("VWorld 응답을 읽지 못했습니다: " + e.getMessage(), e);
        }
    }

    /** 필지 고유번호와 경계(GeoJSON geometry 문자열). */
    public record Parcel(String pnu, String geoJson) {
    }
}
