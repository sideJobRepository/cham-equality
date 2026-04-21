package com.chamapi.file.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum FileType {

    NOTICE("공지사항"),
    SHELTER_IMAGE("대피소 사진");

    private final String value;

}
