from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import PayrollConnector


class PayrollConnectorRepository:
    def list(self, db: Session, *, company_id: str) -> list[PayrollConnector]:
        return db.scalars(
            select(PayrollConnector)
            .where(PayrollConnector.company_id == company_id)
            .order_by(PayrollConnector.created_at.desc())
        ).all()

    def get(self, db: Session, *, company_id: str, connector_id: str) -> PayrollConnector | None:
        return db.scalar(
            select(PayrollConnector).where(
                PayrollConnector.company_id == company_id,
                PayrollConnector.id == connector_id,
            )
        )

    def upsert(self, db: Session, *, company_id: str, connector_id: str | None = None, **data: object) -> PayrollConnector:
        connector = self.get(db, company_id=company_id, connector_id=connector_id) if connector_id else None
        if connector:
            for key, value in data.items():
                setattr(connector, key, value)
            db.flush()
            return connector

        connector = PayrollConnector(company_id=company_id, **data)
        db.add(connector)
        db.flush()
        return connector
