from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.db.models import User, UserRole
from app.db.session import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.repositories.company_repository import CompanyRepository
from app.repositories.payroll_connector_repository import PayrollConnectorRepository
from app.repositories.time_entry_repository import TimeEntryRepository
from app.schemas.integration import (
    ConnectorDispatchResponse,
    PayrollConnectorResponse,
    PayrollConnectorUpsertRequest,
)
from app.services.attendance_service import dispatch_connector_payload
from app.services.report_service import build_report


router = APIRouter(prefix="/payroll-connectors", tags=["payroll-connectors"])
connector_repository = PayrollConnectorRepository()
company_repository = CompanyRepository()
time_entry_repository = TimeEntryRepository()


def serialize_connector(connector) -> PayrollConnectorResponse:
    return PayrollConnectorResponse(
        id=connector.id,
        company_id=connector.company_id,
        name=connector.name,
        provider=connector.provider,
        endpoint_url=connector.endpoint_url,
        payload_format=connector.payload_format,
        is_active=connector.is_active,
        last_delivery_at=connector.last_delivery_at,
        last_delivery_status=connector.last_delivery_status,
        last_delivery_error=connector.last_delivery_error,
        created_at=connector.created_at,
        updated_at=connector.updated_at,
    )


@router.get("", response_model=list[PayrollConnectorResponse])
def list_connectors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PayrollConnectorResponse]:
    return [
        serialize_connector(item)
        for item in connector_repository.list(db, company_id=current_user.company_id)
    ]


@router.post("", response_model=PayrollConnectorResponse, status_code=status.HTTP_201_CREATED)
def upsert_connector(
    connector_id: str | None = Query(default=None),
    payload: PayrollConnectorUpsertRequest = ...,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.NOMINA)),
) -> PayrollConnectorResponse:
    connector = connector_repository.upsert(
        db,
        company_id=current_user.company_id,
        connector_id=connector_id,
        name=payload.name,
        provider=payload.provider,
        endpoint_url=str(payload.endpoint_url),
        auth_token=payload.auth_token,
        payload_format=payload.payload_format,
        is_active=payload.is_active,
    )
    db.commit()
    db.refresh(connector)
    return serialize_connector(connector)


@router.post("/{connector_id}/dispatch", response_model=ConnectorDispatchResponse)
def dispatch_payroll_connector(
    connector_id: str,
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.NOMINA)),
) -> ConnectorDispatchResponse:
    connector = connector_repository.get(
        db,
        company_id=current_user.company_id,
        connector_id=connector_id,
    )
    if not connector:
        raise AppError(
            "Conector no encontrado.",
            code="connector_not_found",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    company = company_repository.get(db, current_user.company_id)
    month_prefix = month or datetime.now(timezone.utc).date().isoformat()[:7]
    entries = [
        item
        for item in time_entry_repository.list(db, company_id=current_user.company_id)
        if item.work_date.isoformat().startswith(month_prefix)
    ]
    report = build_report(entries, total_employees=len(company.employees if company else []))
    payload = {
        "month": month_prefix,
        "company": {
            "id": company.id if company else current_user.company_id,
            "name": company.name if company else None,
            "nit": company.nit if company else None,
        },
        "report": report.model_dump(),
    }
    return dispatch_connector_payload(db, connector=connector, payload=payload)
