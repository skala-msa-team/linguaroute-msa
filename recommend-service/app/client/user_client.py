import httpx

from app.config.settings import settings


class UserServiceUnavailable(RuntimeError):
    pass


class UserServiceClient:
    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or settings.user_service_url

    async def get_company_id(self, user_id: int, authorization: str) -> int:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(
                    f"{self.base_url}/api/users/{user_id}",
                    headers={
                        "Authorization": authorization,
                        "X-User-Id": str(user_id),
                    },
                )
                response.raise_for_status()
                payload = response.json()
                user = payload.get("data", payload)
                return int(user["companyId"])
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as error:
            raise UserServiceUnavailable("직원의 기업 정보를 조회할 수 없습니다") from error


user_client = UserServiceClient()
