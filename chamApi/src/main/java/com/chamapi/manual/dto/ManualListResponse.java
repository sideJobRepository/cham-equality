package com.chamapi.manual.dto;

import com.chamapi.manual.entity.Manual;
import com.chamapi.multilingual.entity.Language;

import java.time.LocalDateTime;

import static com.chamapi.common.util.NullSafe.*;

public record ManualListResponse(
        Long id,
        String language,
        String title,
        LocalDateTime createDate,
        LocalDateTime modifyDate
) {
    public static ManualListResponse from(Manual manual) {
        return new ManualListResponse(
                manual.getId(),
                mapOrNull(manual.getLanguage(), Language::getCode),
                manual.getTitle(),
                manual.getCreateDate(),
                manual.getModifyDate()
        );
    }
}
