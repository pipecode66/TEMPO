from __future__ import annotations

from datetime import date, datetime, time
from typing import Any

from pydantic import BaseModel, Field

from app.models import CalculoJornadaResponse

from .common import TempoSchema


class TimeEntryBase(BaseModel):
    employee_id: str
    work_date: date
    check_in: time
    check_out: time
    is_holiday: bool = False
    is_sunday: bool = False
    weekly_accumulated_hours: float | None = Field(default=None, ge=0)
    notes: str | None = None


class TimeEntryCreateRequest(TimeEntryBase):
    override_employee_age: int | None = Field(default=None, ge=15, le=99)
    override_employee_salary: float | None = Field(default=None, gt=0)


class TimeEntryUpdateRequest(BaseModel):
    work_date: date | None = None
    check_in: time | None = None
    check_out: time | None = None
    is_holiday: bool | None = None
    is_sunday: bool | None = None
    weekly_accumulated_hours: float | None = Field(default=None, ge=0)
    notes: str | None = None


class TimeEntryResponse(TempoSchema):
    id: str
    company_id: str
    employee_id: str
    employee_name: str
    area: str
    work_date: date
    check_in: time
    check_out: time
    is_holiday: bool
    is_sunday: bool
    weekly_accumulated_hours: float
    source: str
    notes: str | None
    calculation_result: CalculoJornadaResponse
    created_at: datetime
    updated_at: datetime


class ImportRowError(BaseModel):
    row_number: int
    row_data: dict[str, Any]
    reason: str


class ImportRowSuccess(BaseModel):
    row_number: int
    time_entry_id: str
    employee_id: str
    employee_name: str


class TimeEntryImportResponse(BaseModel):
    audit_event_id: str
    total_rows: int
    successful_rows: int
    rejected_rows: int
    successes: list[ImportRowSuccess]
    errors: list[ImportRowError]
    error_report_download_url: str | None = None
