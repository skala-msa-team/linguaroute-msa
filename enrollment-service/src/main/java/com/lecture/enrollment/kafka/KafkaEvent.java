package com.lecture.enrollment.kafka;

import lombok.*;

/**
 * Kafka 이벤트 메시지 DTO
 */
public class KafkaEvent {

    /**
     * Enrollment Service → Recommend Service
     * 수강신청 완료 이벤트 발행
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EnrollmentCompletedEvent {
        private Long enrollmentId;
        private Long userId;
        private Long courseId;
    }
}
