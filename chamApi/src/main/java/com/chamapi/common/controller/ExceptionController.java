package com.chamapi.common.controller;



import com.chamapi.common.exception.CustomException;
import com.chamapi.common.dto.ErrorMessageResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

/**
 * 전역 예외 핸들러. 모든 컨트롤러의 예외를 여기서 {@link ErrorMessageResponse} 포맷으로 통일한다.
 * 도메인 예외는 {@link CustomException}을 상속해 자체 HttpStatus를 들고 오게 하고,
 * 그 외 프레임워크/DB/예기치 못한 예외는 400/500으로 내린 뒤 로그만 남긴다.
 */
@RestControllerAdvice
@Slf4j
public class ExceptionController {

    /**
     * {@code @Valid} 실패. 필드별 메시지를 {@code validation} 배열에 담아 프론트가 필드 하이라이트에 쓸 수 있게 한다.
     */
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ErrorMessageResponse exceptionHandler(MethodArgumentNotValidException e) {
        log.info("검증 예외 에러 메시지 ", e);
        BindingResult bindingResult = e.getBindingResult();
        List<FieldError> fieldErrors = bindingResult.getFieldErrors();
        ErrorMessageResponse errorResponse = new ErrorMessageResponse(String.valueOf(HttpStatus.BAD_REQUEST.value()), "잘못된 요청입니다.");
        fieldErrors.forEach(err -> errorResponse.addValidation(err.getField(), err.getDefaultMessage()));
        return errorResponse;
    }
    
     /**
     * 데이터베이스 관련 예외 처리 
     */
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler(DataAccessException.class)
    public ErrorMessageResponse handleDatabaseException(DataAccessException e) {
        log.info("데이터베이스 예외 ", e);
        return new ErrorMessageResponse(
                String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()),
                "데이터베이스 오류가 발생했습니다."
        );
    }
    
    /**
     * NullPointerException 등 예기치 않은 예외 처리
     */
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler(Exception.class)
    public ErrorMessageResponse handleGeneralException(Exception e) {
        log.info("서버 예외 발생", e);
        return new ErrorMessageResponse(
                String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()),
                "잠시후 다시 시도해 주세요"
        );
    }
    
    /**
     * 도메인 예외 처리. 각 예외가 들고 있는 HttpStatus를 그대로 사용해 401/403/409 등 세분화된 응답을 낸다.
     * {@code field}가 붙은 예외(ValidationException 계열)는 검증 예외와 동일하게 {@code validation}에도 실어 보낸다.
     */
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorMessageResponse> handleCustomException(CustomException e) {
        log.info("공통 예외 ", e);
        HttpStatus status = e.getStatus();
        ErrorMessageResponse body = new ErrorMessageResponse(String.valueOf(status.value()), e.getMessage());
        if (e.getField() != null) {
            body.addValidation(e.getField(), e.getMessage());
        }
        return ResponseEntity.status(status).body(body);
    }
}
