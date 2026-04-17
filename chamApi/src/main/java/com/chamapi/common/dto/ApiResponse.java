package com.chamapi.common.dto;


import lombok.Getter;


@Getter
public class ApiResponse<T> {
    private final int code;
    private final boolean success;
    private final String message;
    private final T data;

    public ApiResponse(int code, boolean success, String message, T data) {
        this.code = code;
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public ApiResponse(int code, boolean success, T data) {
        this(code, success, "", data);
    }
    

    public static ApiResponse<Void> of(int code, boolean success, String message) {
        return new ApiResponse<>(code, success, message, null);
    }

}
