package com.chamapi.translation.config;

import com.azure.ai.translation.text.TextTranslationClient;
import com.azure.ai.translation.text.TextTranslationClientBuilder;
import com.azure.core.credential.AzureKeyCredential;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Azure AI Translator 클라이언트. Cognitive Services(Translator) 리소스의 키·지역·엔드포인트로 생성한다.
 * S3 와 달리 AWS 자격증명이 아닌 azure.translator.* 설정을 사용한다.
 */
@Configuration
public class TranslationClientConfig {

    @Value("${azure.translator.key}")
    private String key;

    @Value("${azure.translator.region}")
    private String region;

    @Value("${azure.translator.endpoint}")
    private String endpoint;

    @Bean
    public TextTranslationClient textTranslationClient() {
        return new TextTranslationClientBuilder()
                .credential(new AzureKeyCredential(key))
                .region(region)
                .endpoint(endpoint)
                .buildClient();
    }
}
