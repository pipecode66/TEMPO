from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.db.models import User, UserRole
from app.db.session import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.repositories.company_repository import CompanyRepository
from app.schemas.company import CompanyResponse, CompanyUpsertRequest
from app.services.audit_service import record_audit_event
from app.services.company_service import serialize_company


router = APIRouter(prefix="/company", tags=["company"])
company_repository = CompanyRepository()


@router.get("", response_model=CompanyResponse)
def get_company_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompanyResponse:
    company = company_repository.get(db, current_user.company_id)
    if not company:
        raise AppError("No se encontro la empresa del usuario.", code="company_not_found", status_code=status.HTTP_404_NOT_FOUND)
    return serialize_company(company)


@router.put("", response_model=CompanyResponse)
def upsert_company_profile(
    payload: CompanyUpsertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.NOMINA)),
) -> CompanyResponse:
    company = company_repository.get(db, current_user.company_id)
    if not company:
        raise AppError("No se encontro la empresa del usuario.", code="company_not_found", status_code=status.HTTP_404_NOT_FOUND)

    before = serialize_company(company).model_dump()
    company.name = payload.name
    company.nit = payload.nit
    company.sector = payload.sector
    company.headquarters = payload.headquarters
    company.payroll_contact_name = payload.payroll_contact_name
    company.payroll_contact_email = payload.payroll_contact_email
    company.notes = payload.notes
    company.settings_json = payload.settings.model_dump()
    db.flush()

    record_audit_event(
        db,
        actor=current_user,
        action="company.updated",
        entity_type="company",
        entity_id=company.id,
        before=before,
        after=serialize_company(company).model_dump(),
    )
    db.commit()
    db.refresh(company)
    return serialize_company(company)
