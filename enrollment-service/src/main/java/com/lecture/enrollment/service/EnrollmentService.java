package com.lecture.enrollment.service;

import com.lecture.enrollment.dto.EnrollmentDto;
import com.lecture.enrollment.entity.Enrollment;
import com.lecture.enrollment.exception.EnrollmentException;
import com.lecture.enrollment.exception.ErrorCode;
import com.lecture.enrollment.kafka.EnrollmentKafkaProducer;
import com.lecture.enrollment.kafka.KafkaEvent;
import com.lecture.enrollment.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseServiceClient courseServiceClient;
    private final UserAuthorizationClient userAuthorizationClient;
    private final CompanyEntitlementClient companyEntitlementClient;
    private final EnrollmentKafkaProducer enrollmentKafkaProducer;
    private final EnrollmentWriteService enrollmentWriteService;

    @Transactional
    public EnrollmentDto.EnrollResponse enroll(Long userId, Long courseId) {
        UserAuthorizationClient.AuthorizationContext authorization =
                userAuthorizationClient.getAuthorizationContext(userId);

        if (!authorization.isActiveEmployee()) {
            throw new EnrollmentException(ErrorCode.FORBIDDEN);
        }

        CompanyEntitlementClient.Entitlement entitlement =
                companyEntitlementClient.getEntitlement(authorization.getCompanyId());

        if (!entitlement.isActive()) {
            throw new EnrollmentException(ErrorCode.SUBSCRIPTION_INACTIVE);
        }

        courseServiceClient.validateEnrollable(courseId);

        if (enrollmentRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new EnrollmentException(ErrorCode.DUPLICATE_ENROLLMENT);
        }

        Enrollment enrollment = enrollmentWriteService.createEnrollment(
                authorization.getCompanyId(),
                userId,
                courseId
        );

        enrollmentKafkaProducer.publishEnrollmentCompleted(
                KafkaEvent.EnrollmentCompletedEvent.builder()
                        .enrollmentId(enrollment.getId())
                        .userId(userId)
                        .courseId(courseId)
                        .build()
        );

        log.info("[EnrollmentService] 수강신청 완료 - enrollmentId: {}", enrollment.getId());
        return EnrollmentDto.EnrollResponse.from(enrollment);
    }

    public List<EnrollmentDto.EnrollmentSummaryResponse> getEnrollmentsByUser(Long userId) {
        return enrollmentRepository.findByUserIdOrderByEnrolledAtDesc(userId)
                .stream()
                .map(EnrollmentDto.EnrollmentSummaryResponse::from)
                .toList();
    }

    public EnrollmentDto.EnrollmentHistoryResponse getEnrollmentHistory(Long userId) {
        List<Long> activeCourseIds = enrollmentRepository
                .findByUserIdAndStatusIn(
                        userId,
                        List.of(
                                Enrollment.Status.ENROLLED,
                                Enrollment.Status.LEARNING,
                                Enrollment.Status.COMPLETED
                        )
                )
                .stream()
                .map(Enrollment::getCourseId)
                .toList();

        return EnrollmentDto.EnrollmentHistoryResponse.builder()
                .userId(userId)
                .activeCourseIds(activeCourseIds)
                .build();
    }
}
