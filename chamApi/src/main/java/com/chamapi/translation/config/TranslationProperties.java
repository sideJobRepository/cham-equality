package com.chamapi.translation.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * DeepL 번역 연동 설정. application.yml 의 data.translation.* 와 매핑.
 *
 * 일반 클래스로 둠 — JpaRepositoryMethodInterceptor 의 광역 AOP 포인트컷이
 * CGLIB 프록시를 만들기 때문에 record(final) 는 사용 불가.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "data.translation")
public class TranslationProperties {

    private String apiKey;
    private String baseUrl = "https://api-free.deepl.com";
    private int timeoutMillis = 10000;
}
