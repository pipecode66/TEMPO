from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.db.models import User, UserRole
from app.db.session import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.repositories.worksite_repository import WorksiteRepository
from app.schemas.worksite import (
    WorksiteCreateRequest,
    WorksiteQrTokenCreateRequest,
    WorksiteQrTokenResponse,
    WorksiteResponse,
)


router = APIRouter(prefix="/worksites", tags=["worksites"])
worksite_repository = WorksiteRepository()
settings = get_settings()


def serialize_worksite(worksite) -> WorksiteResponse:
    return WorksiteResponse(
        id=worksite.id,
        company_id=worksite.company_id,
        name=worksite.name,
        address=worksite.address,
        latitude=float(worksite.latitude),
        longitude=float(worksite.longitude),
        radius_meters=float(worksite.radius_meters),
        is_active=worksite.is_active,
        created_at=worksite.created_at,
        updated_at=worksite.updated_at,
    )


def serialize_qr_token(token) -> WorksiteQrTokenResponse:
    qr_url = f"{settings.portal_base_url}?qr={token.token}"
    return WorksiteQrTokenResponse(
        id=token.id,
        company_id=token.company_id,
        worksite_id=token.worksite_id,
        token=token.token,
        qr_url=qr_url,
        expires_at=token.expires_at,
        is_active=token.is_active,
        created_at=token.created_at,
        updated_at=token.updated_at,
    )


@router.get("", response_model=list[WorksiteResponse])
def list_worksites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[WorksiteResponse]:
    return [
        serialize_worksite(worksite)
        for worksite in worksite_repository.list(db, company_id=current_user.company_id)
    ]


@router.post("", response_model=WorksiteResponse, status_code=status.HTTP_201_CREATED)
def create_worksite(
    payload: WorksiteCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.NOMINA, UserRole.SUPERVISOR)
    ),
) -> WorksiteResponse:
    worksite = worksite_repository.create(
        db,
        company_id=current_user.company_id,
        name=payload.name,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius_meters=payload.radius_meters,
    )
    db.commit()
    db.refresh(worksite)
    return serialize_worksite(worksite)


@router.post("/{worksite_id}/qr-token", response_model=WorksiteQrTokenResponse)
def create_worksite_qr_token(
    worksite_id: str,
    payload: WorksiteQrTokenCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.NOMINA, UserRole.SUPERVISOR)
    ),
) -> WorksiteQrTokenResponse:
    worksite = worksite_repository.get(
        db,
        company_id=current_user.company_id,
        worksite_id=worksite_id,
    )
    if not worksite:
        raise AppError(
            "Sitio de trabajo no encontrado.",
            code="worksite_not_found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    qr_token = worksite_repository.create_qr_token(
        db,
        company_id=current_user.company_id,
        worksite_id=worksite.id,
        token=secrets.token_urlsafe(24),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=payload.expires_in_minutes),
        created_by_user_id=current_user.id,
    )
    db.commit()
    db.refresh(qr_token)
    return serialize_qr_token(qr_token)
