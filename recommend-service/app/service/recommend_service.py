import time
from datetime import datetime
from typing import List

from app.client.course_client import course_client
from app.client.enrollment_client import enrollment_client
from app.model.schemas import (
    CourseCandidate,
    RecommendationApiResponse,
    RecommendationRequest,
    RecommendationResult,
    RecommendedCourse,
)


class RecommendService:
    MAX_RECOMMEND_COUNT = 5

    async def recommend(
        self, user_id: int, request: RecommendationRequest
    ) -> RecommendationApiResponse:
        history = await enrollment_client.get_enrollment_history(user_id)
        candidates = await course_client.get_recommend_courses(
            request.language, history.activeCourseIds
        )
        valid_candidates = [
            course
            for course in candidates
            if course.status == "ACTIVE" and course.language == request.language
        ]
        ranked = sorted(
            valid_candidates,
            key=lambda course: (
                course.level == request.level,
                course.situation == request.situation,
                -course.id,
            ),
            reverse=True,
        )[: self.MAX_RECOMMEND_COUNT]
        courses = [self._to_recommended(course, request) for course in ranked]
        return RecommendationApiResponse(
            data=RecommendationResult(
                recommendationId=int(time.time_ns() // 1_000_000),
                source="RULE_BASED_FALLBACK",
                courses=courses,
            ),
            timestamp=datetime.now().astimezone().isoformat(),
        )

    def _to_recommended(
        self, course: CourseCandidate, request: RecommendationRequest
    ) -> RecommendedCourse:
        matched: List[str] = ["선택한 언어"]
        if course.level == request.level:
            matched.append("현재 수준")
        if course.situation == request.situation:
            matched.append("업무 상황")
        reason = f"{', '.join(matched)}과 학습 목표에 적합한 활성 강의입니다."
        return RecommendedCourse(
            courseId=course.id,
            title=course.title,
            language=course.language,
            level=course.level,
            reason=reason,
        )


recommend_service = RecommendService()
