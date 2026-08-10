import logging

from app.client.course_client import CourseServiceClient, course_client
from app.model.schemas import (
    CourseCandidate,
    ProviderRecommendation,
    RecommendedCourse,
    RecommendationData,
    RecommendationRequest,
    RecommendationSource,
    RecommendationStatus,
)
from app.provider.local_ai_provider import LocalAiRecommendationProvider, RecommendationProvider
from app.repository.recommendation_repository import (
    RecommendationRepository,
    SqlAlchemyRecommendationRepository,
)

logger = logging.getLogger(__name__)


class RecommendationService:
    MAX_RECOMMEND_COUNT = 3

    def __init__(
        self,
        course_client: CourseServiceClient,
        provider: RecommendationProvider,
        repository: RecommendationRepository,
    ):
        self.course_client = course_client
        self.provider = provider
        self.repository = repository

    async def recommend(
        self, *, user_id: int, company_id: int, request: RecommendationRequest
    ) -> RecommendationData:
        candidates = await self.course_client.get_candidates(request.language)
        valid_candidates = [
            course
            for course in candidates
            if course.status == "ACTIVE" and course.language == request.language
        ]

        try:
            provider_results = await self.provider.recommend(request, valid_candidates)
            courses = self._validate_results(provider_results, valid_candidates)
            if not courses:
                raise ValueError("유효한 추천 결과가 없습니다")
            source = RecommendationSource.AI
            status = RecommendationStatus.SUCCESS
        except Exception as error:
            logger.warning("추천 제공자 호출 실패, 규칙 기반 추천으로 전환: %s", error)
            courses = self._fallback(request, valid_candidates)
            source = RecommendationSource.RULE_BASED_FALLBACK
            status = RecommendationStatus.FALLBACK

        recommendation_id = await self.repository.save(
            user_id=user_id,
            company_id=company_id,
            request=request,
            source=source,
            status=status,
            courses=courses,
        )
        return RecommendationData(
            recommendationId=recommendation_id,
            source=source,
            courses=courses,
        )

    def _validate_results(
        self,
        results: list[ProviderRecommendation] | list[dict],
        candidates: list[CourseCandidate],
    ) -> list[RecommendedCourse]:
        candidates_by_id = {course.courseId: course for course in candidates}
        selected: list[RecommendedCourse] = []
        seen: set[int] = set()
        for raw_result in results:
            result = (
                raw_result
                if isinstance(raw_result, ProviderRecommendation)
                else ProviderRecommendation.model_validate(raw_result)
            )
            course = candidates_by_id.get(result.courseId)
            if course is None or result.courseId in seen:
                continue
            seen.add(result.courseId)
            selected.append(self._to_recommended_course(course, result.reason))
            if len(selected) == self.MAX_RECOMMEND_COUNT:
                break
        return selected

    def _fallback(
        self, request: RecommendationRequest, candidates: list[CourseCandidate]
    ) -> list[RecommendedCourse]:
        ranked = sorted(
            candidates,
            key=lambda course: (
                course.level == request.level,
                course.situation == request.situation,
            ),
            reverse=True,
        )
        return [
            self._to_recommended_course(
                course, "선택한 언어, 수준과 상황을 기준으로 추천한 강의입니다."
            )
            for course in ranked[: self.MAX_RECOMMEND_COUNT]
        ]

    @staticmethod
    def _to_recommended_course(course: CourseCandidate, reason: str) -> RecommendedCourse:
        return RecommendedCourse(
            courseId=course.courseId,
            title=course.title,
            language=course.language,
            level=course.level,
            reason=reason,
        )


recommend_service = RecommendationService(
    course_client=course_client,
    provider=LocalAiRecommendationProvider(),
    repository=SqlAlchemyRecommendationRepository(),
)
