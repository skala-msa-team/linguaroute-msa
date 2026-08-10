from datetime import datetime, timezone
from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class RecommendationSource(str, Enum):
    AI = "AI"
    RULE_BASED_FALLBACK = "RULE_BASED_FALLBACK"


class RecommendationStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FALLBACK = "FALLBACK"
    FAILED = "FAILED"


class RecommendationRequest(BaseModel):
    language: str = Field(min_length=1, max_length=30)
    level: str = Field(min_length=1, max_length=30)
    job: str = Field(min_length=1, max_length=50)
    situation: str = Field(min_length=1, max_length=50)
    goal: str = Field(min_length=1, max_length=500)


class CourseCandidate(BaseModel):
    courseId: int
    title: str
    language: str
    level: str
    situation: str | None = None
    status: str


class ProviderRecommendation(BaseModel):
    courseId: int
    reason: str = Field(min_length=1, max_length=500)


class RecommendedCourse(BaseModel):
    courseId: int
    title: str
    language: str
    level: str
    reason: str


class RecommendationData(BaseModel):
    recommendationId: int
    source: RecommendationSource
    courses: List[RecommendedCourse]


class RecommendationResponse(BaseModel):
    data: RecommendationData
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
