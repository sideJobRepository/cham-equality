package com.chamapi.advice.exception;

import org.springframework.http.HttpStatus;

public abstract class CustomException extends RuntimeException {
    private String field;
    
    public CustomException(String message) {
        super(message);
    }
    
    public CustomException(String message, String field) {
        super(message);
        this.field = field;
    }
    
    public String getField() {
        return field;
    }
    
    public abstract HttpStatus getStatus();
}
