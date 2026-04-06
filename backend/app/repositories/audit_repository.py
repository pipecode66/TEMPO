from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.db.models import AuditEvent


class AuditRepository:
    def create(self, db: Session, **data: object) -> AuditEvent:
        event = AuditEvent(**data)
        db.add(event)
        db.flush()
        return event

    def list(self, db: Session, *, company_id: str, limit: int = 100) -> Sequence[AuditEvent]:
        query: Select[tuple[AuditEvent]] = (
            select(AuditEvent)
            .where(AuditEvent.company_id == company_id)
            .order_by(AuditEvent.created_at.desc())
            .limit(limit)
        )
        return db.scalars(query).all()
