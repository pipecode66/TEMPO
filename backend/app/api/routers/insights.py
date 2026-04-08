from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.repositories.attendance_request_repository import AttendanceRequestRepository
from app.repositories.time_entry_repository import TimeEntryRepository
from app.schemas.attendance import CostProjectionResponse
from app.services.attendance_service import build_cost_projection
from app.services.time_entry_service import serialize_time_entry


router = APIRouter(prefix="/insights", tags=["insights"])
time_entry_repository = TimeEntryRepository()
attendance_repository = AttendanceRequestRepository()


@router.get("/cost-projection", response_model=CostProjectionResponse)
def get_cost_projection(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CostProjectionResponse:
    month_prefix = month or datetime.now(timezone.utc).date().isoformat()[:7]
    approved_entries = [
        serialize_time_entry(entry)
        for entry in time_entry_repository.list(db, company_id=current_user.company_id)
        if entry.work_date.isoformat().startswith(month_prefix)
    ]
    pending_requests = attendance_repository.list_for_month(
        db,
        company_id=current_user.company_id,
        month_prefix=month_prefix,
        status=None,
    )
    pending_requests = [item for item in pending_requests if item.status.value == "pending"]
    return build_cost_projection(
        month_prefix=month_prefix,
        approved_entries=approved_entries,
        pending_requests=pending_requests,
    )
