from __future__ import annotations

from fastapi import FastAPI, HTTPException

from .calculator import calcular_jornada_diaria
from .models import CalculoJornadaRequest, CalculoJornadaResponse


app = FastAPI(
    title="Tempo API",
    version="0.1.0",
    description=(
        "Backend de control de tiempos para Colombia con calculo de jornada, "
        "recargos, horas extra y alertas legales."
    ),
)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "product": "Tempo",
        "status": "ok",
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.post("/api/v1/jornada/calcular", response_model=CalculoJornadaResponse)
def calculate_workday(payload: CalculoJornadaRequest) -> CalculoJornadaResponse:
    try:
        return calcular_jornada_diaria(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
