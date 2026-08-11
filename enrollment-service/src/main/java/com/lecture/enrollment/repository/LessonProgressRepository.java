package com.lecture.enrollment.repository;

import com.lecture.enrollment.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository
        extends JpaRepository<LessonProgress, Long> {

    // [추가] 특정 차시 진행 상태 조회
    Optional<LessonProgress> findByEnrollment_IdAndLessonId(
            Long enrollmentId,
            Long lessonId
    );

    // [추가] 수강 상세의 전체 차시 진행 상태 조회
    List<LessonProgress> findByEnrollment_IdOrderByLessonIdAsc(
            Long enrollmentId
    );

    // [추가] 완료된 필수 차시 개수 조회
    long countByEnrollment_IdAndLessonIdInAndStatus(
            Long enrollmentId,
            Collection<Long> lessonIds,
            LessonProgress.Status status
    );
}