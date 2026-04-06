from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from .common import TempoSchema


class EmployeeBase(BaseModel):
    external_code: str | None = None
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr | None = None
    position: str = Field(..., min_length=2, max_length=255)
    area: str = Field(..., min_length=2, max_length=255)
    age: int = Field(..., ge=15, le=99)
    base_salary: float = Field(..., gt=0)
    weekly_hours: float = Field(default=42, gt=0, le=48)
    work_days_per_week: int = Field(default=5, ge=5, le=6)
    status: str = Field(default="activo")


class EmployeeCreateRequest(EmployeeBase):
    pass


class EmployeeUpdateRequest(BaseModel):
    external_code: str | None = None
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    email: EmailStr | None = None
    position: str | None = Field(default=None, min_length=2, max_length=255)
    area: str | None = Field(default=None, min_length=2, max_length=255)
    age: int | None = Field(default=None, ge=15, le=99)
    base_salary: float | None = Field(default=None, gt=0)
    weekly_hours: float | None = Field(default=None, gt=0, le=48)
    work_days_per_week: int | None = Field(default=None, ge=5, le=6)
    status: str | None = None


class EmployeeResponse(TempoSchema):
    id: str
    company_id: str
    external_code: str | None
    full_name: str
    email: EmailStr | None
    position: str
    area: str
    age: int
    base_salary: float
    weekly_hours: float
    work_days_per_week: int
    status: str
    created_at: datetime
    updated_at: datetime
