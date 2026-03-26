package com.chamapi.advice.exception;

import org.springframework.http.HttpStatus;

public class RefreshTokenExpiredException extends CustomException{
    public RefreshTokenExpiredException(String message) {
        super(message);
    }
    
    @Override
    public HttpStatus getStatus() {
        return HttpStatus.UNAUTHORIZED;
    }
    
}
