package com.chamapi.file.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum FileProcessStatus {

    CREATE("신규 생성 파일"),
    DELETE("삭제된 파일"),
    NORMAL("유지된 파일");
    
    private final String value;
    
}
