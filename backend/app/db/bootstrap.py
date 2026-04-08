from __future__ import annotations

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.models import Company, UserRole
from app.db.session import engine
from app.repositories.company_repository import CompanyRepository
from app.repositories.user_repository import UserRepository


company_repository = CompanyRepository()
user_repository = UserRepository()


def create_all_tables() -> None:
    Base.metadata.create_all(bind=engine)


def _get_or_create_seed_company(db: Session) -> Company:
    settings = get_settings()
    company = company_repository.get_by_nit(db, settings.seed_company_nit)
    if company:
        return company

    try:
        return company_repository.create(
            db,
            name=settings.seed_company_name,
            nit=settings.seed_company_nit,
            settings_json={
                "jornada_semanal_maxima": 42,
                "dias_laborales_semana": 5,
                "limite_extras_diarias": 2,
                "limite_extras_semanales": 12,
                "horario_nocturno_inicio": "19:00",
                "horario_nocturno_fin": "06:00",
                "alertas_automaticas": True,
                "cierre_semanal_automatico": False,
                "recargo_descanso_obligatorio": 0.9,
                "fecha_normativa": "2026-07-15",
            },
        )
    except IntegrityError:
        db.rollback()
        company = company_repository.get_by_nit(db, settings.seed_company_nit)
        if company:
            return company
        raise


def _get_or_create_seed_admin(db: Session, company: Company) -> None:
    settings = get_settings()
    user = user_repository.get_by_email(db, settings.seed_admin_email)
    if user:
        return

    try:
        user_repository.create(
            db,
            company_id=company.id,
            email=settings.seed_admin_email.lower(),
            full_name=settings.seed_admin_name,
            role=UserRole.ADMIN,
            password_hash=hash_password(settings.seed_admin_password),
            is_active=True,
        )
    except IntegrityError:
        db.rollback()
        user = user_repository.get_by_email(db, settings.seed_admin_email)
        if user:
            return
        raise


def seed_defaults(db: Session) -> None:
    company = _get_or_create_seed_company(db)
    _get_or_create_seed_admin(db, company)
    db.commit()
