from __future__ import annotations

from fastapi import APIRouter

from .routers import audit, auth, calculation, company, employees, reports, time_entries


api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(company.router)
api_router.include_router(employees.router)
api_router.include_router(time_entries.router)
api_router.include_router(reports.router)
api_router.include_router(audit.router)
api_router.include_router(calculation.router)
