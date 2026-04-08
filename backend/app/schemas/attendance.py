from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models import CalculoJornadaResponse

from .common import TempoSchema
from .time_entry import TimeEntryResponse


class GeoCaptureRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy_meters: float | None = Field(default=None, ge=0)


class StartShiftRequest(BaseModel):
    qr_token: str | None = None
    geo: GeoCaptureRequest | None = None
    notes: str | None = None


class EndShiftRequest(BaseModel):
    geo: GeoCaptureRequest | None = None
    justification: str | None = None
    notes: str | None = None
    is_holiday: bool = False


class AttendanceApprovalDecisionRequest(BaseModel):
    comment: str = Field(..., min_length=2, max_length=1000)


class AttendanceRequestResponse(TempoSchema):
    id: str
    company_id: str
    employee_id: str
    employee_name: str
    employee_email: str | None
    worksite_id: str | None
    worksite_name: str | None
    work_date: date
    check_in_at: datetime
    check_out_at: datetime | None
    status: str
    verification_method: str
    notes: str | None
    justification: str | None
    requires_justification: bool
    approval_comment: str | None
    approved_by_user_id: str | None
    approved_at: datetime | None
    projected_extra_cost: float
    preview: CalculoJornadaResponse | None
    created_at: datetime
    updated_at: datetime


class EmployeePortalSummaryResponse(TempoSchema):
    employee_name: str
    employee_email: str | None
    worksite_options: list[dict[str, str]]
    current_shift: AttendanceRequestResponse | None
    pending_requests: list[AttendanceRequestResponse]
    approved_entries: list[TimeEntryResponse]
    month_extra_cost: float
    month_hours: float


class CostProjectionResponse(TempoSchema):
    month_label: str
    actual_extra_cost: float
    pending_extra_cost: float
    projected_month_end_extra_cost: float
    approved_hours: float
    pending_hours: float
