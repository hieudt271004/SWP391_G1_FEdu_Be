package com.fedu.fedu.exception;

import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.ResponseError;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MissingRequestHeaderException;

import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            MissingServletRequestParameterException.class,
            MissingRequestHeaderException.class,
            ConstraintViolationException.class
    })
    @ApiResponses(@ApiResponse(responseCode = "400", description = "Bad Request",
            content = @Content(mediaType = APPLICATION_JSON_VALUE, examples = @ExampleObject(
                    value = "{ \"status\": 400, \"message\": \"email: must not be blank\" }"))))
    public ResponseEntity<ResponseData<Void>> handleValidation(Exception e) {
        String message = e.getMessage();
        if (e instanceof MethodArgumentNotValidException ex) {
            message = ex.getBindingResult().getFieldErrors().stream()
                    .findFirst()
                    .map(err -> err.getField() + ": " + err.getDefaultMessage())
                    .orElse("Invalid payload");
        } else if (e instanceof ConstraintViolationException) {
            int idx = message.indexOf(" ");
            if (idx > 0) message = message.substring(idx + 1);
        }
        log.warn("Validation error: {}", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseError(HttpStatus.BAD_REQUEST.value(), message));
    }

    /** Token sai/hết hạn, sai mật khẩu */
    @ExceptionHandler({AuthenticationException.class, BadCredentialsException.class})
    @ApiResponses(@ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(mediaType = APPLICATION_JSON_VALUE, examples = @ExampleObject(
                    value = "{ \"status\": 401, \"message\": \"Bad credentials\" }"))))
    public ResponseEntity<ResponseData<Void>> handleAuthentication(Exception e) {
        log.warn("Authentication failed: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ResponseError(HttpStatus.UNAUTHORIZED.value(), e.getMessage()));
    }

    /** Đã login nhưng không đủ quyền */
    @ExceptionHandler(AccessDeniedException.class)
    @ApiResponses(@ApiResponse(responseCode = "403", description = "Forbidden",
            content = @Content(mediaType = APPLICATION_JSON_VALUE, examples = @ExampleObject(
                    value = "{ \"status\": 403, \"message\": \"Bạn không có quyền truy cập\" }"))))
    public ResponseEntity<ResponseData<Void>> handleAccessDenied(AccessDeniedException e) {
        log.warn("Access denied: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ResponseError(HttpStatus.FORBIDDEN.value(), "Bạn không có quyền truy cập"));
    }

    /** Resource không tồn tại */
    @ExceptionHandler(ResourceNotFoundException.class)
    @ApiResponses(@ApiResponse(responseCode = "404", description = "Not Found",
            content = @Content(mediaType = APPLICATION_JSON_VALUE, examples = @ExampleObject(
                    value = "{ \"status\": 404, \"message\": \"Classroom not found with id: 1\" }"))))
    public ResponseEntity<ResponseData<Void>> handleNotFound(ResourceNotFoundException e) {
        log.warn("Resource not found: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ResponseError(HttpStatus.NOT_FOUND.value(), e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ResponseData<Void>> handleIllegalArgument(IllegalArgumentException e) {
        log.warn("Illegal argument: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseError(HttpStatus.BAD_REQUEST.value(), e.getMessage()));
    }

    @ExceptionHandler(InvalidDataException.class)
    @ApiResponses(@ApiResponse(responseCode = "409", description = "Conflict",
            content = @Content(mediaType = APPLICATION_JSON_VALUE, examples = @ExampleObject(
                    value = "{ \"status\": 409, \"message\": \"Email already exists\" }"))))
    public ResponseEntity<ResponseData<Void>> handleInvalidData(InvalidDataException e) {
        log.warn("Invalid data: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ResponseError(HttpStatus.CONFLICT.value(), e.getMessage()));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ResponseData<Void>> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException e) {
        log.warn("Database integrity violation: {}", e.getMessage());
        String msg = "Dữ liệu bị xung đột hoặc đã tồn tại.";
        if (e.getMessage() != null && e.getMessage().contains("uniq_active_classroom_path")) {
            msg = "Classroom đã có lộ trình. Xóa draft hoặc unpublish trước.";
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ResponseError(HttpStatus.CONFLICT.value(), msg));
    }

    /** Fallback */
    @ExceptionHandler(Exception.class)
    @ApiResponses(@ApiResponse(responseCode = "500", description = "Internal Server Error",
            content = @Content(mediaType = APPLICATION_JSON_VALUE, examples = @ExampleObject(
                    value = "{ \"status\": 500, \"message\": \"Lỗi hệ thống, vui lòng thử lại sau\" }"))))
    public ResponseEntity<ResponseData<Void>> handleGeneric(Exception e) {
        log.error("Unexpected error", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        "Lỗi hệ thống, vui lòng thử lại sau"));
    }
}