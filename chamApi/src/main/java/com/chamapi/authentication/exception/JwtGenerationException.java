package com.chamapi.authentication.exception;

import com.chamapi.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class JwtGenerationException extends CustomException {
    public JwtGenerationException(String message, Throwable cause) {
        super(message);
        initCause(cause);
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
}
