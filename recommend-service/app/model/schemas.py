from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class Language(str, Enum):
    ENGLISH = "ENGLISH"
    JAPANESE = "JAPANESE"
    CHINESE = "CHINESE"


class Level(str, Enum):
    BEGINNER = "BEGINNER"
    ELEMENTARY = "ELEMENTARY"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"


class Situation(str, Enum):
    CUSTOMER_MEETING = "CUSTOMER_MEETING"
    PRESENTATION = "PRESENTATION"
    EMAIL = "EMAIL"
    BUSINESS_TRIP = "BUSINESS_TRIP"
    DAILY_CONVERSATION = "DAILY_CONVERSATION"


class RecommendationRequest(BaseModel):
    language: Language
    level: Level
    job: str = Field(min_length=1, max_length=100)
    situation: Situation
    goal: str = Field(min_length=1, max_length=500)


class CourseCandidate(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    language: Language
    situation: Situation
    level: Level
    status: str


class RecommendedCourse(BaseModel):
    courseId: int
    title: str
    language: Language
    level: Level
    reason: str


class RecommendationResult(BaseModel):
    recommendationId: int
    source: str
    courses: List[RecommendedCourse]


class RecommendationApiResponse(BaseModel):
    data: RecommendationResult
    timestamp: str


class EnrollmentHistoryResponse(BaseModel):
    userId: int
    activeCourseIds: List[int]


class AuthorizationContext(BaseModel):
    userId: int
    companyId: Optional[int] = None
    businessRole: str
    status: str
