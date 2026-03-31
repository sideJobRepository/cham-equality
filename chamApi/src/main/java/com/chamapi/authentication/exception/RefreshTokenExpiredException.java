package com.chamapi.authentication.exception;

import com.chamapi.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class RefreshTokenExpiredException extends CustomException {
    public RefreshTokenExpiredException(String message) {
        super(message);
    }
    
    @Override
    public HttpStatus getStatus() {
        return HttpStatus.UNAUTHORIZED;
    }
    
}
