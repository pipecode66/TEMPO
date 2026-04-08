from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from .common import TempoSchema


class WorksiteCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    address: str | None = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_meters: float = Field(default=150, gt=0, le=5000)


class WorksiteResponse(TempoSchema):
    id: str
    company_id: str
    name: str
    address: str | None
    latitude: float
    longitude: float
    radius_meters: float
    is_active: bool
    created_at: datetime
    updated_at: datetime


class WorksiteQrTokenCreateRequest(BaseModel):
    expires_in_minutes: int = Field(default=240, ge=5, le=10080)


class WorksiteQrTokenResponse(TempoSchema):
    id: str
    company_id: str
    worksite_id: str
    token: str
    qr_url: str
    expires_at: datetime | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
