package com.lecture.course.controller;

import com.lecture.course.dto.CourseDto;
import com.lecture.course.service.CourseService;
import com.lecture.course.service.UserAuthorizationClient;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/courses")
@RequiredArgsConstructor
public class AdminCourseController {

    private final CourseService courseService;
    private final UserAuthorizationClient userAuthorizationClient;

    @PostMapping
    public ResponseEntity<CourseDto.ApiResponse<CourseDto.CourseResponse>> createCourse(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody CourseDto.CreateRequest request) {
        userAuthorizationClient.requirePlatformAdmin(userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CourseDto.ApiResponse.success(courseService.createCourse(request)));
    }

    @PatchMapping("/{courseId}")
    public ResponseEntity<CourseDto.ApiResponse<CourseDto.CourseResponse>> updateCourse(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long courseId,
            @Valid @RequestBody CourseDto.UpdateRequest request) {
        userAuthorizationClient.requirePlatformAdmin(userId);
        return ResponseEntity.ok(CourseDto.ApiResponse.success(courseService.updateCourse(courseId, request)));
    }

    @PatchMapping("/{courseId}/status")
    public ResponseEntity<CourseDto.ApiResponse<CourseDto.CourseResponse>> changeCourseStatus(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long courseId,
            @Valid @RequestBody CourseDto.StatusRequest request) {
        userAuthorizationClient.requirePlatformAdmin(userId);
        return ResponseEntity.ok(CourseDto.ApiResponse.success(courseService.changeCourseStatus(courseId, request)));
    }
}
