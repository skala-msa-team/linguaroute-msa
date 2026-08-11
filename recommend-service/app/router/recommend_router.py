import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.client.user_client import user_client
from app.config.security import verify_token
from app.model.schemas import RecommendationApiResponse, RecommendationRequest
from app.service.recommend_service import recommend_service

router = APIRouter(tags=["recommend"])


@router.post(
    "/api/courses/recommendations", response_model=RecommendationApiResponse
)
async def create_recommendation(
    request: RecommendationRequest,
    token_payload: dict = Depends(verify_token),
):
    user_id = token_payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="토큰에 사용자 ID가 없습니다")
    try:
        authorization = await user_client.get_authorization_context(int(user_id))
        if authorization.status != "ACTIVE":
            raise HTTPException(status_code=403, detail="활성 사용자만 요청할 수 있습니다")
        if authorization.businessRole != "EMPLOYEE":
            raise HTTPException(status_code=403, detail="직원 권한이 필요합니다")
        return await recommend_service.recommend(int(user_id), request)
    except HTTPException:
        raise
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="추천 의존 서비스에 연결할 수 없습니다",
        ) from error


@router.get("/health", include_in_schema=False)
async def health_check():
    return {"status": "UP", "service": "recommend-service"}
