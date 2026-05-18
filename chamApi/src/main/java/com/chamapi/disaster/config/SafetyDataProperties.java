package com.chamapi.disaster.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 재난안전데이터공유플랫폼 (safetydata.go.kr) 연동 설정.
 * application.yml 의 data.api.* 와 매핑.
 *
 * 일반 클래스로 둠 — JpaRepositoryMethodInterceptor 의 광역 AOP 포인트컷이
 * CGLIB 프록시를 만들기 때문에 record(final) 는 사용 불가.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "data.api")
public class SafetyDataProperties {

    private String key;
    private String baseUrl = "https://www.safetydata.go.kr";
    private String disasterMessagePath = "/V2/api/DSSP-IF-00247";
    private String region = "대전";
    private int pageSize = 100;
    private int timeoutMillis = 5000;
    private int syncDays = 2;
}
