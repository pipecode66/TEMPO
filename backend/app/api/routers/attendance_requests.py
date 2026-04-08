from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.db.models import User, UserRole, WorkLogStatus
from app.db.session import get_db
from app.dependencies.auth import require_roles
from app.repositories.attendance_request_repository import AttendanceRequestRepository
from app.schemas.attendance import AttendanceApprovalDecisionRequest, AttendanceRequestResponse
from app.services.attendance_service import (
    approve_request,
    reject_request,
    serialize_attendance_request,
)


router = APIRouter(prefix="/attendance-requests", tags=["attendance-requests"])
attendance_repository = AttendanceRequestRepository()


def parse_status(value: str | None) -> WorkLogStatus | None:
    if value is None:
        return None
    try:
        return WorkLogStatus(value)
    except ValueError as exc:
        raise AppError(
            "El estado solicitado no es valido.",
            code="attendance_status_invalid",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        ) from exc


@router.get("", response_model=list[AttendanceRequestResponse])
def list_attendance_requests(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.NOMINA, UserRole.SUPERVISOR)
    ),
) -> list[AttendanceRequestResponse]:
    requests = attendance_repository.list_for_company(
        db,
        company_id=current_user.company_id,
        status=parse_status(status_filter),
    )
    return [serialize_attendance_request(item) for item in requests]


@router.post("/{request_id}/approve", response_model=AttendanceRequestResponse)
def approve_attendance_request(
    request_id: str,
    payload: AttendanceApprovalDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.NOMINA, UserRole.SUPERVISOR)
    ),
) -> AttendanceRequestResponse:
    request_record = attendance_repository.get(
        db,
        company_id=current_user.company_id,
        request_id=request_id,
    )
    if not request_record:
        raise AppError(
            "Solicitud de jornada no encontrada.",
            code="attendance_request_not_found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    request_record = approve_request(
        db,
        current_user=current_user,
        request_record=request_record,
        comment=payload.comment,
    )
    return serialize_attendance_request(request_record)


@router.post("/{request_id}/reject", response_model=AttendanceRequestResponse)
def reject_attendance_request(
    request_id: str,
    payload: AttendanceApprovalDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.NOMINA, UserRole.SUPERVISOR)
    ),
) -> AttendanceRequestResponse:
    request_record = attendance_repository.get(
        db,
        company_id=current_user.company_id,
        request_id=request_id,
    )
    if not request_record:
        raise AppError(
            "Solicitud de jornada no encontrada.",
            code="attendance_request_not_found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    request_record = reject_request(
        db,
        current_user=current_user,
        request_record=request_record,
        comment=payload.comment,
    )
    return serialize_attendance_request(request_record)
