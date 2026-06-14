package com.chamapi.admin.dto.request;


import java.time.LocalDateTime;

public record AdminContentUpdateRequest(
        String name,
        Long imageFileId,
        String url,
        String additionalInfo,
        LocalDateTime displayStartDate,
        LocalDateTime displayEndDate
) {}
