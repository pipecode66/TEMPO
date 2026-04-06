from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.calculator import calcular_jornada_diaria
from app.db.models import User
from app.dependencies.auth import get_current_user
from app.models import CalculoJornadaRequest, CalculoJornadaResponse


router = APIRouter(tags=["calculation"])


@router.post("/jornada/calcular", response_model=CalculoJornadaResponse)
def calculate_workday(
    payload: CalculoJornadaRequest,
    current_user: User = Depends(get_current_user),
) -> CalculoJornadaResponse:
    del current_user
    try:
        return calcular_jornada_diaria(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
