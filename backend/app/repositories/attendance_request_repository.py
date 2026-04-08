from __future__ import annotations

from datetime import date

from sqlalchemy import Select, select
from sqlalchemy.orm import Session, joinedload

from app.db.models import AttendanceRequest, Employee, WorkLogStatus


class AttendanceRequestRepository:
    def _base_query(self) -> Select[tuple[AttendanceRequest]]:
        return select(AttendanceRequest).options(
            joinedload(AttendanceRequest.employee),
            joinedload(AttendanceRequest.worksite),
        )

    def list_for_company(
        self,
        db: Session,
        *,
        company_id: str,
        status: WorkLogStatus | None = None,
    ) -> list[AttendanceRequest]:
        query = self._base_query().where(AttendanceRequest.company_id == company_id)
        if status:
            query = query.where(AttendanceRequest.status == status)
        return db.scalars(
            query.order_by(AttendanceRequest.created_at.desc(), AttendanceRequest.check_in_at.desc())
        ).all()

    def list_for_employee(
        self,
        db: Session,
        *,
        company_id: str,
        employee_id: str,
    ) -> list[AttendanceRequest]:
        query = self._base_query().where(
            AttendanceRequest.company_id == company_id,
            AttendanceRequest.employee_id == employee_id,
        )
        return db.scalars(query.order_by(AttendanceRequest.created_at.desc())).all()

    def get(
        self,
        db: Session,
        *,
        company_id: str,
        request_id: str,
    ) -> AttendanceRequest | None:
        return db.scalar(
            self._base_query().where(
                AttendanceRequest.company_id == company_id,
                AttendanceRequest.id == request_id,
            )
        )

    def get_open_for_employee(
        self,
        db: Session,
        *,
        company_id: str,
        employee_id: str,
    ) -> AttendanceRequest | None:
        return db.scalar(
            self._base_query().where(
                AttendanceRequest.company_id == company_id,
                AttendanceRequest.employee_id == employee_id,
                AttendanceRequest.status == WorkLogStatus.OPEN,
            )
        )

    def create(self, db: Session, **data: object) -> AttendanceRequest:
        request = AttendanceRequest(**data)
        db.add(request)
        db.flush()
        return request

    def list_for_month(
        self,
        db: Session,
        *,
        company_id: str,
        month_prefix: str,
        status: WorkLogStatus | None = None,
    ) -> list[AttendanceRequest]:
        query = self._base_query().where(
            AttendanceRequest.company_id == company_id,
        )
        if status:
            query = query.where(AttendanceRequest.status == status)
        results = db.scalars(query).all()
        return [request for request in results if request.work_date.isoformat().startswith(month_prefix)]

    def find_employee_by_email(
        self,
        db: Session,
        *,
        company_id: str,
        email: str,
    ) -> Employee | None:
        return db.scalar(
            select(Employee)
            .options(joinedload(Employee.policy_assignment))
            .where(
                Employee.company_id == company_id,
                Employee.email == email.lower(),
            )
        )
