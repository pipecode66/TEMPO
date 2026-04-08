from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.models import Employee, User, WorkLogStatus
from app.db.session import get_db
from app.dependencies.auth import get_current_employee, require_portal_user
from app.repositories.attendance_request_repository import AttendanceRequestRepository
from app.repositories.time_entry_repository import TimeEntryRepository
from app.repositories.worksite_repository import WorksiteRepository
from app.schemas.attendance import (
    AttendanceRequestResponse,
    EmployeePortalSummaryResponse,
    EndShiftRequest,
    StartShiftRequest,
)
from app.services.attendance_service import (
    end_shift,
    extract_extra_cost,
    serialize_attendance_request,
    start_shift,
)
from app.services.time_entry_service import serialize_time_entry


router = APIRouter(prefix="/self-service", tags=["self-service"])
attendance_repository = AttendanceRequestRepository()
time_entry_repository = TimeEntryRepository()
worksite_repository = WorksiteRepository()


@router.get("/summary", response_model=EmployeePortalSummaryResponse)
def get_portal_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_portal_user),
    employee: Employee = Depends(get_current_employee),
) -> EmployeePortalSummaryResponse:
    requests = attendance_repository.list_for_employee(
        db,
        company_id=current_user.company_id,
        employee_id=employee.id,
    )
    current_shift = next((item for item in requests if item.status == WorkLogStatus.OPEN), None)
    pending_requests = [
        serialize_attendance_request(item)
        for item in requests
        if item.status == WorkLogStatus.PENDING
    ]

    approved_entries = [
        serialize_time_entry(item)
        for item in time_entry_repository.list(
            db,
            company_id=current_user.company_id,
            employee_id=employee.id,
        )
    ]

    month_prefix = datetime.now(timezone.utc).date().isoformat()[:7]
    month_entries = [
        entry for entry in approved_entries if entry.work_date.isoformat().startswith(month_prefix)
    ]
    month_extra_cost = round(
        sum(extract_extra_cost(entry.calculation_result.model_dump()) for entry in month_entries),
        2,
    )
    month_hours = round(
        sum(float(entry.calculation_result.horas_totales_dia) for entry in month_entries),
        2,
    )

    return EmployeePortalSummaryResponse(
        employee_name=employee.full_name,
        employee_email=employee.email,
        worksite_options=[
            {"id": worksite.id, "name": worksite.name}
            for worksite in worksite_repository.list(db, company_id=current_user.company_id)
            if worksite.is_active
        ],
        current_shift=serialize_attendance_request(current_shift) if current_shift else None,
        pending_requests=pending_requests,
        approved_entries=month_entries[:12],
        month_extra_cost=month_extra_cost,
        month_hours=month_hours,
    )


@router.post("/start", response_model=AttendanceRequestResponse)
def start_employee_shift(
    payload: StartShiftRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_portal_user),
    employee: Employee = Depends(get_current_employee),
) -> AttendanceRequestResponse:
    request_record = start_shift(
        db,
        current_user=current_user,
        employee=employee,
        payload=payload,
    )
    return serialize_attendance_request(request_record)


@router.post("/end", response_model=AttendanceRequestResponse)
def end_employee_shift(
    payload: EndShiftRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_portal_user),
    employee: Employee = Depends(get_current_employee),
) -> AttendanceRequestResponse:
    request_record = end_shift(
        db,
        current_user=current_user,
        employee=employee,
        payload=payload,
    )
    return serialize_attendance_request(request_record)
