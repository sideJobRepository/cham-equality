package com.chamapi.advice.response;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 예시 응답
 * {
 * "code": "400",                 // 오류 코드
 * "message": "잘못된 요청입니다.",  // 오류 메시지
 * "validation": [                 // 유효성 검사 오류 리스트 (배열)
 * {
 * "cont": "내용은 필수 입력 입니다." // 'cont' 필드가 비어있을 때 발생하는 오류 메시지
 * }
 * ]
 * }
 */
@RequiredArgsConstructor
@Setter
@Getter
public class ErrorMessageResponse {
    private final String  code;
    
    private final String message;
    
    private List<Map<String, String>> validation = new ArrayList<>();
    
    public void addValidation(String fieldName, String errorMessage) {
        if (this.validation == null) {
            this.validation = new ArrayList<>();
        }
        Map<String, String> map = new HashMap<>();
        map.put(fieldName, errorMessage);
        this.validation.add(map);
    }
    
    public static ErrorMessageResponse messageError(String code, String message) {
        return new ErrorMessageResponse(code, message);
    }
}
