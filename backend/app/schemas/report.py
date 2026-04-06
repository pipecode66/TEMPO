from __future__ import annotations

from pydantic import BaseModel


class ReportSummary(BaseModel):
    total_employees: int
    total_time_entries: int
    total_hours: float
    total_value: float
    legal_alerts: int
    compliance_rate: float


class ReportRow(BaseModel):
    time_entry_id: str
    employee_id: str
    employee_name: str
    area: str
    work_date: str
    check_in: str
    check_out: str
    total_hours: float
    total_value: float
    legal_alert: bool


class ReportResponse(BaseModel):
    summary: ReportSummary
    rows: list[ReportRow]
