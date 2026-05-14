from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProjectCreate(BaseModel):
    name: str
    repo_url: str
    language: str = "python"


class ProjectOut(BaseModel):
    id: str
    name: str
    repo_url: str
    language: str
    created_at: datetime


class ScanStartRequest(BaseModel):
    project_id: str


class ScanSummary(BaseModel):
    scan_id: str
    project_id: str
    status: str
    risks: dict[str, float]
    anti_patterns: list[str]
    created_at: datetime


class RecommendationOut(BaseModel):
    module: str
    severity: str
    explanation: str
    actions: list[str]


class GenericMessage(BaseModel):
    message: str
    data: dict[str, Any] | None = None

