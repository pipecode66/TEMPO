from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TempoSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    message: str


class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: str


class ErrorResponse(BaseModel):
    error: ErrorDetail


class AuditActor(BaseModel):
    id: str
    full_name: str
    email: str
    role: str


class TimestampedResponse(TempoSchema):
    id: str
    created_at: datetime
    updated_at: datetime
