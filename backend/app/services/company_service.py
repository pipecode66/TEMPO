from __future__ import annotations

from app.db.models import Company
from app.schemas.company import CompanyResponse, PolicySettingsSchema


def serialize_company(company: Company) -> CompanyResponse:
    return CompanyResponse(
        id=company.id,
        name=company.name,
        nit=company.nit,
        sector=company.sector,
        headquarters=company.headquarters,
        payroll_contact_name=company.payroll_contact_name,
        payroll_contact_email=company.payroll_contact_email,
        notes=company.notes,
        settings=PolicySettingsSchema.model_validate(company.settings_json or {}),
    )
