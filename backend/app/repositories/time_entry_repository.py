from __future__ import annotations

from collections.abc import Sequence
from datetime import date

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session, joinedload

from app.db.models import CalculationResult, Employee, TimeEntry


class TimeEntryRepository:
    def list(
        self,
        db: Session,
        *,
        company_id: str,
        start_date: date | None = None,
        end_date: date | None = None,
        employee_id: str | None = None,
        area: str | None = None,
        legal_alert: bool | None = None,
    ) -> Sequence[TimeEntry]:
        query: Select[tuple[TimeEntry]] = (
            select(TimeEntry)
            .options(
                joinedload(TimeEntry.employee),
                joinedload(TimeEntry.calculation_result),
            )
            .where(TimeEntry.company_id == company_id)
        )

        if start_date:
            query = query.where(TimeEntry.work_date >= start_date)
        if end_date:
            query = query.where(TimeEntry.work_date <= end_date)
        if employee_id:
            query = query.where(TimeEntry.employee_id == employee_id)
        if area:
            query = query.join(TimeEntry.employee).where(Employee.area == area)
        if legal_alert is not None:
            query = query.join(TimeEntry.calculation_result).where(
                CalculationResult.legal_alert == legal_alert
            )

        return db.scalars(query.order_by(TimeEntry.work_date.desc(), TimeEntry.created_at.desc())).all()

    def get(self, db: Session, *, company_id: str, entry_id: str) -> TimeEntry | None:
        return db.scalar(
            select(TimeEntry)
            .options(joinedload(TimeEntry.employee), joinedload(TimeEntry.calculation_result))
            .where(TimeEntry.company_id == company_id, TimeEntry.id == entry_id)
        )

    def get_by_signature(
        self,
        db: Session,
        *,
        company_id: str,
        employee_id: str,
        work_date: date,
        check_in,
        check_out,
    ) -> TimeEntry | None:
        return db.scalar(
            select(TimeEntry)
            .where(
                TimeEntry.company_id == company_id,
                TimeEntry.employee_id == employee_id,
                TimeEntry.work_date == work_date,
                TimeEntry.check_in == check_in,
                TimeEntry.check_out == check_out,
            )
        )

    def create(self, db: Session, **data: object) -> TimeEntry:
        entry = TimeEntry(**data)
        db.add(entry)
        db.flush()
        return entry

    def delete(self, db: Session, *, company_id: str, entry_id: str) -> None:
        entry = self.get(db, company_id=company_id, entry_id=entry_id)
        if entry:
            db.delete(entry)

    def get_weekly_accumulated_hours_before(
        self,
        db: Session,
        *,
        employee_id: str,
        week_start: date,
        before_date: date,
    ) -> float:
        total = db.scalar(
            select(func.coalesce(func.sum(CalculationResult.total_day_hours), 0.0))
            .join(TimeEntry.calculation_result)
            .where(
                TimeEntry.employee_id == employee_id,
                TimeEntry.work_date >= week_start,
                TimeEntry.work_date < before_date,
            )
        )
        return float(total or 0.0)
