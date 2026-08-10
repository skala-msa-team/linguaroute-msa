package com.lecture.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private T data;
    private String code;
    private String message;
    private OffsetDateTime timestamp;

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data, null, null, OffsetDateTime.now());
    }

    public static ApiResponse<Void> error(String code, String message) {
        return new ApiResponse<>(null, code, message, OffsetDateTime.now());
    }
}
