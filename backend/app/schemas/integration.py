from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl

from .common import TempoSchema


class PayrollConnectorUpsertRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    provider: str = Field(..., min_length=2, max_length=80)
    endpoint_url: HttpUrl
    auth_token: str | None = Field(default=None, max_length=255)
    payload_format: str = Field(default="json", pattern="^(json|csv)$")
    is_active: bool = True


class PayrollConnectorResponse(TempoSchema):
    id: str
    company_id: str
    name: str
    provider: str
    endpoint_url: str
    payload_format: str
    is_active: bool
    last_delivery_at: datetime | None
    last_delivery_status: str | None
    last_delivery_error: str | None
    created_at: datetime
    updated_at: datetime


class ConnectorDispatchResponse(BaseModel):
    connector_id: str
    status: str
    detail: str
