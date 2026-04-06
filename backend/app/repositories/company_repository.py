from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Company


class CompanyRepository:
    def get(self, db: Session, company_id: str) -> Company | None:
        return db.get(Company, company_id)

    def get_by_nit(self, db: Session, nit: str) -> Company | None:
        return db.scalar(select(Company).where(Company.nit == nit))

    def get_first(self, db: Session) -> Company | None:
        return db.scalar(select(Company).limit(1))

    def create(self, db: Session, **data: object) -> Company:
        company = Company(**data)
        db.add(company)
        db.flush()
        return company
