package com.lecture.course.service;

import com.lecture.course.dto.CourseDto;
import com.lecture.course.entity.Course;
import com.lecture.course.exception.CourseErrorCode;
import com.lecture.course.exception.CourseException;
import com.lecture.course.repository.CourseRepository;
import com.lecture.course.repository.CourseSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseService {

    private final CourseRepository courseRepository;

    /**
     * 강의 등록
     */
    @Transactional
    public CourseDto.CourseResponse createCourse(CourseDto.CreateRequest request) {
        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .language(request.getLanguage())
                .situation(request.getSituation())
                .level(request.getLevel())
                .build();

        return CourseDto.CourseResponse.from(courseRepository.save(course));
    }

    /**
     * 강의 단건 조회
     */
    public CourseDto.CourseResponse getCourse(Long id) {
        Course course = findCourseById(id);
        if (course.getStatus() != Course.Status.ACTIVE) {
            throw new CourseException(CourseErrorCode.COURSE_INACTIVE);
        }
        return CourseDto.CourseResponse.from(course);
    }

    public CourseDto.CoursePageResponse searchCourses(
            String keyword,
            Course.Language language,
            Course.Situation situation,
            Course.Level level,
            Pageable pageable) {
        Page<CourseDto.CourseSummaryResponse> result = courseRepository
                .findAll(CourseSpecification.catalogSearch(keyword, language, situation, level), pageable)
                .map(CourseDto.CourseSummaryResponse::from);

        return CourseDto.CoursePageResponse.builder()
                .content(result.getContent())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .build();
    }

    @Transactional
    public CourseDto.CourseResponse updateCourse(Long id, CourseDto.UpdateRequest request) {
        Course course = findCourseById(id);
        course.update(request.getTitle(), request.getDescription(), request.getLanguage(),
                request.getSituation(), request.getLevel());
        return CourseDto.CourseResponse.from(course);
    }

    @Transactional
    public CourseDto.CourseResponse changeCourseStatus(Long id, CourseDto.StatusRequest request) {
        Course course = findCourseById(id);
        course.changeStatus(request.getStatus());
        return CourseDto.CourseResponse.from(course);
    }

    /**
     * 전체 활성 강의 목록 조회
     */
    public List<CourseDto.CourseResponse> getAllCourses() {
        return courseRepository.findByStatus(Course.Status.ACTIVE).stream()
                .map(CourseDto.CourseResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 언어별 활성 강의 조회
     */
    public List<CourseDto.CourseResponse> getCoursesByLanguage(Course.Language language) {
        return courseRepository.findByLanguageAndStatus(language, Course.Status.ACTIVE).stream()
                .map(CourseDto.CourseResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 강의 존재 여부 확인 (Enrollment Service → Course Service REST 호출용)
     */
    public boolean existsCourse(Long id) {
        return courseRepository.existsById(id);
    }

    /**
     * 추천 서비스용: 언어별 미수강 강의 조회
     * - excludeCourseIds: 이미 수강한 강의 ID 목록
     */
    public List<CourseDto.CourseResponse> getRecommendCourses(
            Course.Language language, List<Long> excludeCourseIds) {

        List<Course> courses = excludeCourseIds.isEmpty()
                ? courseRepository.findByLanguageAndStatus(language, Course.Status.ACTIVE)
                : courseRepository.findByLanguageAndStatusAndIdNotIn(
                        language, Course.Status.ACTIVE, excludeCourseIds);

        return courses.stream()
                .map(CourseDto.CourseResponse::from)
                .collect(Collectors.toList());
    }

    private Course findCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new CourseException(CourseErrorCode.COURSE_NOT_FOUND));
    }
}
