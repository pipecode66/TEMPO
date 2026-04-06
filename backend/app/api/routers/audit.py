from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.models import User, UserRole
from app.db.session import get_db
from app.dependencies.auth import require_roles
from app.repositories.audit_repository import AuditRepository
from app.schemas.audit import AuditEventResponse


router = APIRouter(prefix="/audit-events", tags=["audit"])
audit_repository = AuditRepository()


@router.get("", response_model=list[AuditEventResponse])
def list_audit_events(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.NOMINA)),
) -> list[AuditEventResponse]:
    events = audit_repository.list(db, company_id=current_user.company_id, limit=limit)
    return [AuditEventResponse.model_validate(event) for event in events]
