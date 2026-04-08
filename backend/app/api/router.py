from __future__ import annotations

from fastapi import APIRouter

from .routers import (
    attendance_requests,
    audit,
    auth,
    calculation,
    catalogs,
    company,
    employees,
    insights,
    integrations,
    reports,
    self_service,
    time_entries,
    worksites,
)


api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(catalogs.router)
api_router.include_router(company.router)
api_router.include_router(employees.router)
api_router.include_router(time_entries.router)
api_router.include_router(worksites.router)
api_router.include_router(self_service.router)
api_router.include_router(attendance_requests.router)
api_router.include_router(reports.router)
api_router.include_router(insights.router)
api_router.include_router(integrations.router)
api_router.include_router(audit.router)
api_router.include_router(calculation.router)
