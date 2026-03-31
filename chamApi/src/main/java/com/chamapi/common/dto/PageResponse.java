package com.chamapi.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.data.domain.Page;

import java.util.List;


@JsonInclude(JsonInclude.Include.NON_NULL)
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages, boolean first,
                              boolean last, boolean empty,   Long todaySignupCount ) {
    
    public static <T> PageResponse<T> from(Page<T> p) {
        return new PageResponse<>(
                p.getContent(),
                p.getNumber(),
                p.getSize(),
                p.getTotalElements(),
                p.getTotalPages(),
                p.isFirst(),
                p.isLast(),
                p.isEmpty(),
                null
        );
    }
}
