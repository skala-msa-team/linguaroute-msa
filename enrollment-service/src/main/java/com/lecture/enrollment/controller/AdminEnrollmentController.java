package com.lecture.enrollment.controller;

import com.lecture.enrollment.dto.EnrollmentDto;
import com.lecture.enrollment.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * [추가] 플랫폼 관리자용 수강 상태 조회 API
 */
@RestController
@RequestMapping("/api/admin/enrollments")
@RequiredArgsConstructor
public class AdminEnrollmentController {

    private final EnrollmentService enrollmentService;

    /**
     * [추가]
     * GET /api/admin/enrollments
     *
     * 전체 기업의 수강 상태를 페이지 단위로 조회한다.
     */
    @GetMapping
    public ResponseEntity<
            EnrollmentDto.ApiResponse<
                    EnrollmentDto.PageResponse<
                            EnrollmentDto.ManagementEnrollmentResponse
                    >
            >
    > getEnrollments(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        EnrollmentDto.PageResponse<
                EnrollmentDto.ManagementEnrollmentResponse
        > response = enrollmentService.getAdminEnrollments(
                userId,
                page,
                size
        );

        return ResponseEntity.ok(
                EnrollmentDto.ApiResponse.success(response)
        );
    }
}