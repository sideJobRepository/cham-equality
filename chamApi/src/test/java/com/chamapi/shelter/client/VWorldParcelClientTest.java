package com.chamapi.shelter.client;

import com.chamapi.shelter.client.VWorldParcelClient.Parcel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** 실제 VWorld 를 부르지 않고 응답 해석만 확인한다(응답 모양은 2026-10-09 실제 응답 기준). */
class VWorldParcelClientTest {

    private final VWorldParcelClient client = new VWorldParcelClient("test-key", "cham-monimap.com");

    @DisplayName("부지 필지는 PNU 와 geometry 를 GeoJSON 문자열로 돌려준다")
    @Test
    void test1() {
        Optional<Parcel> parcel = client.parse(response("1420대"));

        assertThat(parcel).isPresent();
        assertThat(parcel.get().pnu()).isEqualTo("3017011200114200000");
        assertThat(parcel.get().geoJson()).startsWith("{\"type\":\"MultiPolygon\"");
    }

    @DisplayName("좌표가 도로·하천 필지에 찍히면 부지가 아니므로 버린다")
    @Test
    void test2() {
        assertThat(client.parse(response("12-3도"))).isEmpty();
        assertThat(client.parse(response("55천"))).isEmpty();
    }

    @DisplayName("결과가 없으면 비어 있고, 키 오류 등은 예외로 알린다")
    @Test
    void test3() {
        assertThat(client.parse("{\"response\":{\"status\":\"NOT_FOUND\"}}")).isEmpty();
        assertThatThrownBy(() -> client.parse(
                "{\"response\":{\"status\":\"ERROR\",\"error\":{\"code\":\"INCORRECT_KEY\"}}}"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("INCORRECT_KEY");
    }

    private String response(String jibun) {
        return """
                {"response":{"status":"OK","result":{"featureCollection":{"type":"FeatureCollection","features":[
                  {"type":"Feature",
                   "geometry":{"type":"MultiPolygon","coordinates":[[[[127.383,36.349],[127.386,36.349],[127.386,36.351],[127.383,36.349]]]]},
                   "properties":{"pnu":"3017011200114200000","jibun":"%s","addr":"대전광역시 서구 둔산동 1420"}}
                ]}}}}
                """.formatted(jibun);
    }
}
