from __future__ import annotations

from typing import Any

from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.db.models import AuditEvent, User
from app.repositories.audit_repository import AuditRepository


audit_repository = AuditRepository()


def record_audit_event(
    db: Session,
    *,
    action: str,
    entity_type: str,
    actor: User | None = None,
    company_id: str | None = None,
    entity_id: str | None = None,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditEvent:
    resolved_company_id = company_id or (actor.company_id if actor else None)
    return audit_repository.create(
        db,
        company_id=resolved_company_id,
        actor_user_id=actor.id if actor else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_json=jsonable_encoder(before) if before is not None else None,
        after_json=jsonable_encoder(after) if after is not None else None,
        metadata_json=jsonable_encoder(metadata) if metadata is not None else None,
    )
