package com.chamapi.security.token;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public class TokenPair {
    private final String accessToken;
     private final String refreshToken;
}
