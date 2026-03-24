package com.chamapi.file.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum FileType {
    
    NOTICE("공지사항");
    
    private final String value;
    
}
