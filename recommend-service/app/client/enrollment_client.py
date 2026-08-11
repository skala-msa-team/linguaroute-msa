import httpx

from app.config.settings import settings
from app.model.schemas import EnrollmentHistoryResponse


class EnrollmentServiceClient:
    def __init__(self):
        self.base_url = settings.enrollment_service_url

    async def get_enrollment_history(self, user_id: int) -> EnrollmentHistoryResponse:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{self.base_url}/internal/enrollments/history/{user_id}",
                headers={"X-Internal-Api-Key": settings.internal_api_key},
            )
            response.raise_for_status()
            return EnrollmentHistoryResponse(**response.json())


enrollment_client = EnrollmentServiceClient()
