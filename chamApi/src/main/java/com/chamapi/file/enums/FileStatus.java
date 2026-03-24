package com.chamapi.file.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum FileStatus {
    
    TEMPORARY("임시"),
    COMPLETE("완료");
    
    private final String value;
}
