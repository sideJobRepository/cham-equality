package com.chamapi.admin.dto.request;

import com.chamapi.shelter.enums.ShelterType;

public record AdminShelterUpdateRequest(
        String name,
        Integer builtYear,
        ShelterType shelterType,
        Integer safetyGrade
) {}
