package com.chamapi.geocoding.service;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.geocoding.client.GeocodingClient;
import com.chamapi.geocoding.dto.GeocodingResponse;
import com.chamapi.geocoding.dto.ResolvedAddress;
import com.chamapi.multilingual.entity.Language;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GeocodingService {

    private final GeocodingClient geocodingClient;

    public String convertToEnglishAddress(String address) {
        return geocodingClient.getEnglishAddress(address)
                .orElseThrow(() -> new BadRequestException("영문주소 검색 결과가 없습니다. address = " + address));
    }

    /**
     * 주소를 좌표로 변환한다(정지오코딩). 응답의 x=경도, y=위도.
     */
    public GeocodingResponse.Address getCoordinate(String address) {
        return geocodingClient.getCoordinate(address)
                .orElseThrow(() -> new BadRequestException("좌표 검색 결과가 없습니다. address = " + address));
    }

    public String getAddressByCoord(BigDecimal latitude, BigDecimal longitude, Language lang) {
        ResolvedAddress address = geocodingClient.getAddress(latitude, longitude);

        if (lang == Language.KO) {
            return address.getPreferredAddress()
                    .orElseThrow(() -> new BadRequestException("죄표 -> 주소 변환 결과가 없습니다."));
        }

        return geocodingClient.getEnglishAddress(address.address())
                .orElseGet(() -> geocodingClient.getEnglishAddress(address.oldAddress())
                        .orElseThrow(() -> new BadRequestException("좌표 -> 주소 변환 결과가 없습니다.")));
    }
}
