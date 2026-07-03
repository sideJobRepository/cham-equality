package com.chamapi.geocoding.client;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.Optional;


@SpringBootTest
class GeocodingClientTest {

    @Autowired
    GeocodingClient client;

    @Test
    void getAddressTest() {
        // 대전광역시 대덕구 계족로663번길 29 (법동, 주공아파트)
        var latitude = BigDecimal.valueOf(36.36916061);
        var longitude = BigDecimal.valueOf(127.42573217);

        var result = client.getAddress(latitude, longitude);

        Assertions.assertThat(result.address()).contains("대전광역시 대덕구 계족로663번길 29");
    }

    @Test
    void getEnglishAddressTest() {
        var query = "대전 중구 은행동 145-1";

        Optional<String> result = client.getEnglishAddress(query);

        Assertions.assertThat(result).isNotEmpty();
        Assertions.assertThat(result.get()).isEqualTo("15, Daejong-ro 480beon-gil, Jung-gu, Daejeon, Republic of Korea");
    }
}