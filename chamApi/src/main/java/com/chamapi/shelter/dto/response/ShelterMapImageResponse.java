package com.chamapi.shelter.dto.response;

import com.chamapi.shelter.enums.ShelterImageCategory;

public record ShelterMapImageResponse(
        ShelterImageCategory category,
        String url
){

}

