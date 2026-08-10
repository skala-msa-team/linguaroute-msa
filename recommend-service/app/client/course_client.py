import logging

import httpx

from app.config.settings import settings
from app.model.schemas import CourseCandidate

logger = logging.getLogger(__name__)


class CourseServiceUnavailable(RuntimeError):
    pass


class CourseServiceClient:
    """course-service 공개 API만 사용하여 실제 추천 후보를 조회한다."""

    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or settings.course_service_url

    async def get_candidates(self, language: str) -> list[CourseCandidate]:
        # [설계 이유 - 추천 전용 내부 API 사용]
        # 문제: 초기 추천 코드는 문서에 적힌 공개 목록 API(`/api/courses`)가
        # language/status 필터를 지원한다고 가정했지만, dev의 실제 구현에는 해당
        # 쿼리 계약이 없었다. 그 가정을 유지하면 문서와 코드가 다시 달라질 때
        # 추천 후보 조회가 런타임에서 실패한다.
        # 선택: course-service 담당자가 추천용으로 만든 내부 API만 호출한다.
        # 이유: 강의 조회와 ACTIVE 필터는 강의 데이터를 소유한 서비스가 수행하고,
        # recommend-service는 응답을 소비하는 역할에 집중해야 MSA 책임이 분리된다.
        url = f"{self.base_url}/api/courses/internal/recommend"
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(url, params={"language": language})
                response.raise_for_status()
                payload = response.json()
                raw_courses = (
                    payload.get("data", payload) if isinstance(payload, dict) else payload
                )

                # [설계 이유 - id를 courseId로 변환]
                # 문제: course-service 엔티티 응답은 `id`, 추천 API와 OpenAI 응답은
                # `courseId`를 사용한다. 이 차이를 서비스 전역에 노출하면 매 단계마다
                # 두 이름을 확인해야 하고, 존재하지 않는 강의 검증도 실수하기 쉽다.
                # 선택: 외부 서비스 응답을 받는 이 경계에서 한 번만 courseId로 바꾼다.
                # 대안으로 강의 담당자의 API 이름을 바꿀 수도 있지만, 다른 서비스의
                # 계약을 깨는 비용보다 소비자인 추천 서비스에서 변환하는 비용이 작다.
                return [
                    CourseCandidate.model_validate(
                        {**course, "courseId": course.get("courseId", course.get("id"))}
                    )
                    for course in raw_courses
                ]
        except (httpx.HTTPError, ValueError) as error:
            logger.error("[CourseClient] 추천 후보 조회 실패: %s", error)
            raise CourseServiceUnavailable("강의 정보를 조회할 수 없습니다") from error


course_client = CourseServiceClient()
