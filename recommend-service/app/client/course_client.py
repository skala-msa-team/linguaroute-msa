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
        url = f"{self.base_url}/api/courses"
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(
                    url, params={"language": language, "status": "ACTIVE"}
                )
                response.raise_for_status()
                payload = response.json()
        except (httpx.HTTPError, ValueError) as error:
            logger.error("[CourseClient] 추천 후보 조회 실패: %s", error)
            raise CourseServiceUnavailable("강의 정보를 조회할 수 없습니다") from error

        raw_courses = payload.get("data", payload) if isinstance(payload, dict) else payload
        return [CourseCandidate.model_validate(course) for course in raw_courses]


course_client = CourseServiceClient()
