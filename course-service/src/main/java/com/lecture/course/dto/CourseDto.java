package com.lecture.course.dto;

import com.lecture.course.entity.Course;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class CourseDto {

    // 강의 등록 요청
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {

        @NotBlank(message = "강의 제목은 필수입니다")
        private String title;

        private String description;

        @NotNull(message = "언어는 필수입니다")
        private Course.Language language;

        @NotNull(message = "상황은 필수입니다")
        private Course.Situation situation;

        @NotNull(message = "난이도는 필수입니다")
        private Course.Level level;
    }

    // 강의 응답
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CourseResponse {
        private Long id;
        private String title;
        private String description;
        private Course.Language language;
        private Course.Situation situation;
        private Course.Level level;
        private Course.Status status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static CourseResponse from(Course course) {
            return CourseResponse.builder()
                    .id(course.getId())
                    .title(course.getTitle())
                    .description(course.getDescription())
                    .language(course.getLanguage())
                    .situation(course.getSituation())
                    .level(course.getLevel())
                    .status(course.getStatus())
                    .createdAt(course.getCreatedAt())
                    .updatedAt(course.getUpdatedAt())
                    .build();
        }
    }

    // 공통 API 응답 래퍼
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;

        public static <T> ApiResponse<T> success(T data) {
            return ApiResponse.<T>builder()
                    .success(true)
                    .message("성공")
                    .data(data)
                    .build();
        }

        public static <T> ApiResponse<T> error(String message) {
            return ApiResponse.<T>builder()
                    .success(false)
                    .message(message)
                    .build();
        }
    }

    // 추천 서비스용 응답 (언어 기반 강의 목록)
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecommendResponse {
        private List<CourseResponse> courses;
        private Course.Language language;
    }
}
