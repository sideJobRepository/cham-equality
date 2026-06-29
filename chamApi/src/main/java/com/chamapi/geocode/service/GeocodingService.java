package com.chamapi.geocode.service;

import com.chamapi.geocode.client.GeocodingClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GeocodingService {

    private final GeocodingClient geocodingClient;

    public String convertToEnglishAddress(String address){
        return geocodingClient.getEnglishAddress(address);
    }

}
