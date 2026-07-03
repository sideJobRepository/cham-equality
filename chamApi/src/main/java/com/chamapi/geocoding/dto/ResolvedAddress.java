package com.chamapi.geocoding.dto;

import org.springframework.util.StringUtils;

import java.util.Optional;

public record ResolvedAddress(
        String address,
        String oldAddress
) {

    public Optional<String> getPreferredAddress() {
        if (StringUtils.hasText(address)) {
            return Optional.of(address);
        }
        if (StringUtils.hasText(oldAddress)) {
            return Optional.of(oldAddress);
        }
        return Optional.empty();
    }
}
