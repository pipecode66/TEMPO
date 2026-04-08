from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.db.models import Worksite, WorksiteQrToken


class WorksiteRepository:
    def list(self, db: Session, *, company_id: str) -> list[Worksite]:
        query: Select[tuple[Worksite]] = select(Worksite).where(
            Worksite.company_id == company_id
        )
        return db.scalars(query.order_by(Worksite.created_at.desc())).all()

    def get(self, db: Session, *, company_id: str, worksite_id: str) -> Worksite | None:
        return db.scalar(
            select(Worksite).where(
                Worksite.company_id == company_id,
                Worksite.id == worksite_id,
            )
        )

    def create(self, db: Session, **data: object) -> Worksite:
        worksite = Worksite(**data)
        db.add(worksite)
        db.flush()
        return worksite

    def create_qr_token(self, db: Session, **data: object) -> WorksiteQrToken:
        token = WorksiteQrToken(**data)
        db.add(token)
        db.flush()
        return token

    def get_qr_token(self, db: Session, *, token: str) -> WorksiteQrToken | None:
        qr_token = db.scalar(select(WorksiteQrToken).where(WorksiteQrToken.token == token))
        if not qr_token or not qr_token.is_active:
            return None
        if qr_token.expires_at and qr_token.expires_at < datetime.now(timezone.utc):
            return None
        return qr_token
