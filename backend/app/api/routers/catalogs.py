from __future__ import annotations

from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.legal_rules import get_supported_jurisdictions
from app.schemas.catalog import JurisdictionOptionResponse


router = APIRouter(prefix="/catalogs", tags=["catalogs"])


@router.get("/jurisdictions", response_model=list[JurisdictionOptionResponse])
def list_jurisdictions(_: object = Depends(get_current_user)) -> list[JurisdictionOptionResponse]:
    return [
        JurisdictionOptionResponse(
            code=pack.code,
            name=pack.name,
            country_code=pack.country_code,
            subdivision_code=pack.subdivision_code,
            daily_overtime_limit_hours=pack.daily_overtime_limit_hours,
            weekly_overtime_limit_hours=pack.weekly_overtime_limit_hours,
        )
        for pack in get_supported_jurisdictions()
    ]
