package com.chamapi.security.handler;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public class TokenPair {
    private final String accessToken;
     private final String refreshToken;
}
