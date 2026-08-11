from typing import List

import httpx

from app.config.settings import settings
from app.model.schemas import CourseCandidate, Language


class CourseServiceClient:
    def __init__(self):
        self.base_url = settings.course_service_url

    async def get_recommend_courses(
        self, language: Language, exclude_ids: List[int]
    ) -> List[CourseCandidate]:
        params: list[tuple[str, str]] = [("language", language.value)]
        params.extend(("excludeIds", str(course_id)) for course_id in exclude_ids)
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{self.base_url}/internal/courses/recommend",
                params=params,
                headers={"X-Internal-Api-Key": settings.internal_api_key},
            )
            response.raise_for_status()
            return [CourseCandidate(**course) for course in response.json()]


course_client = CourseServiceClient()
