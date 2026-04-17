package com.chamapi.common.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String FILE_VIEW_URL = "fileViewUrl";

    public static final Duration FILE_VIEW_URL_TTL = Duration.ofMinutes(50);

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.registerCustomCache(FILE_VIEW_URL,
                Caffeine.newBuilder()
                        .expireAfterWrite(FILE_VIEW_URL_TTL)
                        .maximumSize(10_000)
                        .build());
        return manager;
    }
}
