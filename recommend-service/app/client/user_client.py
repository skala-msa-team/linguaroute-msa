import httpx

from app.config.settings import settings
from app.model.schemas import AuthorizationContext


class UserServiceClient:
    def __init__(self):
        self.base_url = settings.user_service_url

    async def get_authorization_context(self, user_id: int) -> AuthorizationContext:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{self.base_url}/internal/users/{user_id}/authorization-context",
                headers={"X-Internal-Api-Key": settings.internal_api_key},
            )
            response.raise_for_status()
            return AuthorizationContext(**response.json()["data"])


user_client = UserServiceClient()
