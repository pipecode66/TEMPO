from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.time_entry_repository import TimeEntryRepository
from app.schemas.report import ReportResponse
from app.services.report_service import build_report, export_report_csv, export_report_json


router = APIRouter(prefix="/reports", tags=["reports"])
time_entry_repository = TimeEntryRepository()
employee_repository = EmployeeRepository()


def get_report_data(
    db: Session,
    *,
    company_id: str,
    start_date: date | None,
    end_date: date | None,
    employee_id: str | None,
    area: str | None,
    legal_alert: bool | None,
) -> ReportResponse:
    entries = time_entry_repository.list(
        db,
        company_id=company_id,
        start_date=start_date,
        end_date=end_date,
        employee_id=employee_id,
        area=area,
        legal_alert=legal_alert,
    )
    employees = employee_repository.list(db, company_id=company_id)
    return build_report(entries, total_employees=len(employees))


@router.get("", response_model=ReportResponse)
def get_reports(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    employee_id: str | None = Query(default=None),
    area: str | None = Query(default=None),
    legal_alert: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    return get_report_data(
        db,
        company_id=current_user.company_id,
        start_date=start_date,
        end_date=end_date,
        employee_id=employee_id,
        area=area,
        legal_alert=legal_alert,
    )


@router.get("/export.csv")
def export_reports_csv(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    employee_id: str | None = Query(default=None),
    area: str | None = Query(default=None),
    legal_alert: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    report = get_report_data(
        db,
        company_id=current_user.company_id,
        start_date=start_date,
        end_date=end_date,
        employee_id=employee_id,
        area=area,
        legal_alert=legal_alert,
    )
    content = export_report_csv(report)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="tempo-report.csv"'},
    )


@router.get("/export.json")
def export_reports_json(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    employee_id: str | None = Query(default=None),
    area: str | None = Query(default=None),
    legal_alert: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    report = get_report_data(
        db,
        company_id=current_user.company_id,
        start_date=start_date,
        end_date=end_date,
        employee_id=employee_id,
        area=area,
        legal_alert=legal_alert,
    )
    content = export_report_json(report)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="tempo-report.json"'},
    )
