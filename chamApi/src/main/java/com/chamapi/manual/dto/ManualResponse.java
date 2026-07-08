package com.chamapi.manual.dto;

import com.chamapi.common.util.NullSafe;
import com.chamapi.manual.entity.Manual;
import com.chamapi.multilingual.entity.Language;

import java.time.LocalDateTime;

import static com.chamapi.common.util.NullSafe.*;

public record ManualResponse(
        Long id,
        String language,
        String title,
        String content,
        LocalDateTime createDate,
        LocalDateTime modifyDate
) {
    public static ManualResponse from(Manual manual) {
        return new ManualResponse(
                manual.getId(),
                mapOrNull(manual.getLanguage(), Language::getCode),
                manual.getTitle(),
                manual.getContent(),
                manual.getCreateDate(),
                manual.getModifyDate()
        );
    }
}
