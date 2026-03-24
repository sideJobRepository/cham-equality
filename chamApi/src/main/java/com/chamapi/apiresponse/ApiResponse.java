package com.chamapi.apiresponse;


import lombok.Getter;
import lombok.RequiredArgsConstructor;


@Getter
public class ApiResponse<T> {
    private int code;
    private boolean success;
    private String message;
    private T data;
    
    public ApiResponse(int code, boolean success, String message) {
        this.code = code;
        this.success = success;
        this.message = message;
    }
    
    public ApiResponse(int code, boolean success, String message, T data) {
        this.code = code;
        this.success = success;
        this.message = message;
        this.data = data;
    }
}
