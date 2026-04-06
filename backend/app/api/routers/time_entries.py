from __future__ import annotations

import json
from datetime import date

from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.db.models import User, UserRole
from app.db.session import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models import CalculoJornadaRequest, CalculoJornadaResponse
from app.repositories.audit_repository import AuditRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.time_entry_repository import TimeEntryRepository
from app.schemas.time_entry import (
    TimeEntryCreateRequest,
    TimeEntryImportResponse,
    TimeEntryResponse,
    TimeEntryUpdateRequest,
)
from app.services.import_service import export_import_errors_csv, import_time_entries
from app.services.time_entry_service import (
    create_time_entry_with_calculation,
    serialize_time_entry,
    update_time_entry_with_calculation,
)
from app.calculator import calcular_jornada_diaria


router = APIRouter(prefix="/time-entries", tags=["time_entries"])
employee_repository = EmployeeRepository()
time_entry_repository = TimeEntryRepository()
company_repository = CompanyRepository()
audit_repository = AuditRepository()


@router.get("", response_model=list[TimeEntryResponse])
def list_time_entries(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    employee_id: str | None = Query(default=None),
    area: str | None = Query(default=None),
    legal_alert: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TimeEntryResponse]:
    entries = time_entry_repository.list(
        db,
        company_id=current_user.company_id,
        start_date=start_date,
        end_date=end_date,
        employee_id=employee_id,
        area=area,
        legal_alert=legal_alert,
    )
    return [serialize_time_entry(entry) for entry in entries]


@router.post("", response_model=TimeEntryResponse, status_code=status.HTTP_201_CREATED)
def create_time_entry(
    payload: TimeEntryCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.NOMINA, UserRole.SUPERVISOR)
    ),
) -> TimeEntryResponse:
    company = company_repository.get(db, current_user.company_id)
    employee = employee_repository.get(
        db, company_id=current_user.company_id, employee_id=payload.employee_id
    )
    if not company or not employee:
        raise AppError("No se encontro el empleado solicitado.", code="employee_not_found", status_code=status.HTTP_404_NOT_FOUND)

    entry = create_time_entry_with_calculation(
        db,
        actor=current_user,
        employee=employee,
        payload=payload,
        company_settings=company.settings_json or {},
    )
    db.commit()
    db.refresh(entry)
    return serialize_time_entry(entry)


@router.get("/{entry_id}", response_model=TimeEntryResponse)
def get_time_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TimeEntryResponse:
    entry = time_entry_repository.get(db, company_id=current_user.company_id, entry_id=entry_id)
    if not entry:
        raise AppError("Jornada no encontrada.", code="time_entry_not_found", status_code=status.HTTP_404_NOT_FOUND)
    return serialize_time_entry(entry)


@router.patch("/{entry_id}", response_model=TimeEntryResponse)
def update_time_entry(
    entry_id: str,
    payload: TimeEntryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.NOMINA, UserRole.SUPERVISOR)
    ),
) -> TimeEntryResponse:
    entry = time_entry_repository.get(db, company_id=current_user.company_id, entry_id=entry_id)
    company = company_repository.get(db, current_user.company_id)
    if not entry or not company:
        raise AppError("Jornada no encontrada.", code="time_entry_not_found", status_code=status.HTTP_404_NOT_FOUND)
    entry = update_time_entry_with_calculation(
        db,
        actor=current_user,
        entry=entry,
        payload=payload,
        company_settings=company.settings_json or {},
    )
    db.commit()
    db.refresh(entry)
    return serialize_time_entry(entry)


@router.delete("/{entry_id}")
def delete_time_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.NOMINA)),
) -> dict[str, str]:
    entry = time_entry_repository.get(db, company_id=current_user.company_id, entry_id=entry_id)
    if not entry:
        raise AppError("Jornada no encontrada.", code="time_entry_not_found", status_code=status.HTTP_404_NOT_FOUND)
    before = serialize_time_entry(entry).model_dump(mode="json")
    time_entry_repository.delete(db, company_id=current_user.company_id, entry_id=entry_id)
    from app.services.audit_service import record_audit_event

    record_audit_event(
        db,
        actor=current_user,
        action="time_entry.deleted",
        entity_type="time_entry",
        entity_id=entry_id,
        before=before,
    )
    db.commit()
    return {"message": "Jornada eliminada."}


@router.post("/import", response_model=TimeEntryImportResponse, status_code=status.HTTP_201_CREATED)
def import_entries(
    file: UploadFile = File(...),
    mapping: str | None = Form(default=None),
    create_missing_employees: bool = Form(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.NOMINA, UserRole.SUPERVISOR)
    ),
) -> TimeEntryImportResponse:
    company = company_repository.get(db, current_user.company_id)
    if not company:
        raise AppError("No se encontro la empresa del usuario.", code="company_not_found", status_code=status.HTTP_404_NOT_FOUND)
    payload = file.file.read()
    explicit_mapping = json.loads(mapping) if mapping else None
    result = import_time_entries(
        db,
        actor=current_user,
        company=company,
        filename=file.filename or "import.csv",
        payload=payload,
        explicit_mapping=explicit_mapping,
        create_missing_employees=create_missing_employees,
    )
    db.commit()
    return result


@router.get("/imports/{audit_event_id}/errors.csv")
def download_import_errors(
    audit_event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    events = audit_repository.list(db, company_id=current_user.company_id, limit=500)
    event = next((item for item in events if item.id == audit_event_id), None)
    if not event:
        raise AppError("No se encontro el reporte de importacion.", code="import_audit_not_found", status_code=status.HTTP_404_NOT_FOUND)
    errors = (event.metadata_json or {}).get("errors", [])
    csv_content = export_import_errors_csv(errors)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="tempo-import-errors-{audit_event_id}.csv"'
        },
    )


@router.post("/calculate-preview", response_model=CalculoJornadaResponse)
def calculate_preview(
    payload: CalculoJornadaRequest,
    current_user: User = Depends(get_current_user),
) -> CalculoJornadaResponse:
    del current_user
    return calcular_jornada_diaria(payload)
