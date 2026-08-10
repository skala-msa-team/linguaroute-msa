package com.lecture.course.controller;

import com.lecture.course.dto.CourseDto;
import com.lecture.course.entity.Course;
import com.lecture.course.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    /**
     * GET /courses - 전체 강의 목록
     */
    @GetMapping
    public ResponseEntity<CourseDto.ApiResponse<CourseDto.CoursePageResponse>> getAllCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Course.Language language,
            @RequestParam(required = false) Course.Situation situation,
            @RequestParam(required = false) Course.Level level,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                CourseDto.ApiResponse.success(courseService.searchCourses(
                        keyword, language, situation, level,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"))))
        );
    }

    /**
     * GET /courses/{id} - 강의 상세
     */
    @GetMapping("/{id}")
    public ResponseEntity<CourseDto.ApiResponse<CourseDto.CourseResponse>> getCourse(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                CourseDto.ApiResponse.success(courseService.getCourse(id))
        );
    }

    /**
     * GET /courses/internal/exists/{id} - 강의 존재 여부 (Enrollment Service 호출)
     */
    @GetMapping("/internal/exists/{id}")
    public ResponseEntity<Boolean> existsCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.existsCourse(id));
    }

    /**
     * GET /courses/internal/{id} - 강의 상세 조회 (Enrollment Service 내부 호출용)
     * - 내 수강 목록 응답 조립 시 사용
     * - 래퍼 없이 CourseResponse만 직접 반환
     */
    @GetMapping("/internal/{id}")
    public ResponseEntity<CourseDto.CourseResponse> getCourseInternal(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourse(id));
    }

    /**
     * GET /courses/internal/recommend - 추천 서비스용 미수강 강의 조회
     * language: 언어, excludeIds: 이미 수강한 강의 ID 목록
     */
    @GetMapping("/internal/recommend")
    public ResponseEntity<List<CourseDto.CourseResponse>> getRecommendCourses(
            @RequestParam Course.Language language,
            @RequestParam(defaultValue = "") List<Long> excludeIds) {
        return ResponseEntity.ok(courseService.getRecommendCourses(language, excludeIds));
    }
}
