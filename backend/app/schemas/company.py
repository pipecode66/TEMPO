from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field

from .common import TempoSchema


class PolicySettingsSchema(BaseModel):
    jurisdiction_code: str = "co-national-2026"
    country_code: str = "CO"
    subdivision_code: str | None = None
    jornada_semanal_maxima: float = Field(default=42, gt=0)
    dias_laborales_semana: int = Field(default=5, ge=5, le=6)
    limite_extras_diarias: float = Field(default=2, ge=0)
    limite_extras_semanales: float = Field(default=12, ge=0)
    horario_nocturno_inicio: str = "19:00"
    horario_nocturno_fin: str = "06:00"
    alertas_automaticas: bool = True
    cierre_semanal_automatico: bool = False
    requires_qr_for_field: bool = False
    recargo_descanso_obligatorio: float = Field(default=0.9, ge=0, le=1)
    fecha_normativa: str = "2026-07-15"


class CompanyUpsertRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    nit: str = Field(..., min_length=3, max_length=64)
    sector: str | None = None
    headquarters: str | None = None
    payroll_contact_name: str | None = None
    payroll_contact_email: EmailStr | None = None
    notes: str | None = None
    settings: PolicySettingsSchema = Field(default_factory=PolicySettingsSchema)


class CompanyResponse(TempoSchema):
    id: str
    name: str
    nit: str
    sector: str | None
    headquarters: str | None
    payroll_contact_name: str | None
    payroll_contact_email: EmailStr | None
    notes: str | None
    settings: PolicySettingsSchema
