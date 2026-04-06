from __future__ import annotations

from datetime import datetime
from typing import Any

from .common import TempoSchema


class AuditEventResponse(TempoSchema):
    id: str
    company_id: str | None
    actor_user_id: str | None
    action: str
    entity_type: str
    entity_id: str | None
    before_json: dict[str, Any] | None
    after_json: dict[str, Any] | None
    metadata_json: dict[str, Any] | None
    created_at: datetime
