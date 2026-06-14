package com.chamapi.multilingual.entity;

import com.chamapi.common.exception.BadRequestException;

import java.util.Arrays;

public enum Language {
    KO("ko"),
    EN("en"),
    ZH("zh"),
    JA("ja"),
    VI("vi");

    private final String code;

    Language(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static Language fromCode(String code) {
        return Arrays.stream(values())
                .filter(language -> language.code.equalsIgnoreCase(code))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("지원하지 않는 언어 코드입니다: " + code));
    }
}
