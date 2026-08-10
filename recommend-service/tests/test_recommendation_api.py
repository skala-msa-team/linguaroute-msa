from unittest.mock import AsyncMock

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.model.schemas import RecommendationData, RecommendationSource
from app.router import recommend_router


def build_client() -> TestClient:
    app = FastAPI()
    app.include_router(recommend_router.router)
    return TestClient(app)


def valid_body():
    return {
        "language": "ENGLISH",
        "level": "INTERMEDIATE",
        "job": "GLOBAL_SALES",
        "situation": "CUSTOMER_MEETING",
        "goal": "제품을 자연스럽게 설명하고 싶음",
    }


def test_employee_can_request_recommendations(monkeypatch):
    result = RecommendationData(
        recommendationId=3001,
        source=RecommendationSource.AI,
        courses=[],
    )
    mocked = AsyncMock(return_value=result)
    monkeypatch.setattr(recommend_router.recommend_service, "recommend", mocked)
    company_lookup = AsyncMock(return_value=10)
    monkeypatch.setattr(recommend_router.user_client, "get_company_id", company_lookup)

    response = build_client().post(
        "/api/courses/recommendations",
        headers={
            "X-User-Id": "7",
            "X-User-Role": "EMPLOYEE",
            "Authorization": "Bearer test-token",
        },
        json=valid_body(),
    )

    assert response.status_code == 200
    assert response.json()["data"]["recommendationId"] == 3001
    assert response.json()["data"]["source"] == "AI"
    assert response.json()["timestamp"]


def test_non_employee_is_forbidden():
    response = build_client().post(
        "/api/courses/recommendations",
        headers={
            "X-User-Id": "7",
            "X-User-Role": "COMPANY_ADMIN",
            "Authorization": "Bearer test-token",
        },
        json=valid_body(),
    )

    assert response.status_code == 403


def test_gateway_identity_headers_are_required():
    response = build_client().post(
        "/api/courses/recommendations",
        json=valid_body(),
    )

    assert response.status_code == 422
