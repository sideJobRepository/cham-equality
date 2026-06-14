package com.chamapi.admin.dto.request;

import com.chamapi.content.enums.ContentType;

import java.time.LocalDateTime;

public record AdminContentCreateRequest(
        ContentType contentType,
        String name,
        Long imageFileId,
        String url,
        String additionalInfo,
        LocalDateTime displayStartDate,
        LocalDateTime displayEndDate
) {}
