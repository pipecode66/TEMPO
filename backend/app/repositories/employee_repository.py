from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.db.models import Employee, TimeEntry


class EmployeeRepository:
    def list(
        self,
        db: Session,
        *,
        company_id: str,
        search: str | None = None,
        status: str | None = None,
    ) -> Sequence[Employee]:
        query: Select[tuple[Employee]] = select(Employee).where(
            Employee.company_id == company_id
        )
        query = query.options(joinedload(Employee.policy_assignment))
        if search:
            pattern = f"%{search.lower()}%"
            query = query.where(
                or_(
                    Employee.full_name.ilike(pattern),
                    Employee.email.ilike(pattern),
                    Employee.position.ilike(pattern),
                    Employee.area.ilike(pattern),
                )
            )
        if status:
            query = query.where(Employee.status == status)
        return db.scalars(query.order_by(Employee.created_at.desc())).all()

    def get(self, db: Session, *, company_id: str, employee_id: str) -> Employee | None:
        return db.scalar(
            select(Employee).where(
                Employee.company_id == company_id,
                Employee.id == employee_id,
            )
            .options(joinedload(Employee.policy_assignment))
        )

    def get_by_identity(
        self,
        db: Session,
        *,
        company_id: str,
        email: str | None = None,
        external_code: str | None = None,
        full_name: str | None = None,
    ) -> Employee | None:
        conditions = [Employee.company_id == company_id]
        if email:
            conditions.append(Employee.email == email.lower())
        elif external_code:
            conditions.append(Employee.external_code == external_code)
        elif full_name:
            conditions.append(Employee.full_name == full_name)
        else:
            return None

        return db.scalar(select(Employee).where(*conditions).options(joinedload(Employee.policy_assignment)))

    def create(self, db: Session, **data: object) -> Employee:
        employee = Employee(**data)
        db.add(employee)
        db.flush()
        return employee

    def has_time_entries(self, db: Session, *, company_id: str, employee_id: str) -> bool:
        total = db.scalar(
            select(func.count(TimeEntry.id)).where(
                TimeEntry.company_id == company_id,
                TimeEntry.employee_id == employee_id,
            )
        )
        return bool(total)

    def delete(self, db: Session, *, company_id: str, employee_id: str) -> None:
        employee = self.get(db, company_id=company_id, employee_id=employee_id)
        if employee:
            db.delete(employee)
