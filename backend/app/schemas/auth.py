from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from .common import TempoSchema


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class RegisterRequest(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255)
    company_nit: str = Field(..., min_length=3, max_length=64)
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token_expires_in: int
    refresh_token_expires_in: int
    user: "AuthenticatedUser"


class AuthenticatedUser(TempoSchema):
    id: str
    company_id: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    last_login_at: datetime | None


TokenResponse.model_rebuild()
