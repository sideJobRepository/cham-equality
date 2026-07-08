package com.chamapi.manual.dto;

public record ManualUpdateRequest(
        String language,
        String title,
        String content
) {}
