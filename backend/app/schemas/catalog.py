from __future__ import annotations

from .common import TempoSchema


class JurisdictionOptionResponse(TempoSchema):
    code: str
    name: str
    country_code: str
    subdivision_code: str | None
    daily_overtime_limit_hours: float
    weekly_overtime_limit_hours: float
