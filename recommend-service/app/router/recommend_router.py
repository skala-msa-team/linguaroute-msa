from fastapi import APIRouter, Header, HTTPException, status

from app.client.user_client import UserServiceUnavailable, user_client
from app.model.schemas import RecommendationRequest, RecommendationResponse
from app.service.recommend_service import recommend_service

router = APIRouter(prefix="/api/courses/recommendations", tags=["recommendation"])


@router.post("", response_model=RecommendationResponse)
async def create_recommendation(
    request: RecommendationRequest,
    x_user_id: int = Header(alias="X-User-Id"),
    x_user_role: str = Header(alias="X-User-Role"),
    authorization: str = Header(alias="Authorization"),
):
    if x_user_role != "EMPLOYEE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="직원만 강의 추천을 요청할 수 있습니다",
        )
    try:
        company_id = await user_client.get_company_id(x_user_id, authorization)
    except UserServiceUnavailable as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error

    data = await recommend_service.recommend(
        user_id=x_user_id,
        company_id=company_id,
        request=request,
    )
    return RecommendationResponse(data=data)


@router.get("/health", include_in_schema=False)
async def health_check():
    return {"status": "UP", "service": "recommend-service"}
