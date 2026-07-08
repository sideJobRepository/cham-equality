package com.chamapi.manual.dto;

public record ManualCreateRequest(
        String language,
        String title,
        String content
) {}
