from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import EmployeePolicyAssignment


class EmployeePolicyRepository:
    def get_by_employee(self, db: Session, *, employee_id: str) -> EmployeePolicyAssignment | None:
        return db.scalar(
            select(EmployeePolicyAssignment).where(
                EmployeePolicyAssignment.employee_id == employee_id
            )
        )

    def upsert(
        self,
        db: Session,
        *,
        company_id: str,
        employee_id: str,
        jurisdiction_code: str,
        country_code: str,
        subdivision_code: str | None,
        timezone_name: str | None = None,
    ) -> EmployeePolicyAssignment:
        assignment = self.get_by_employee(db, employee_id=employee_id)
        if assignment:
            assignment.jurisdiction_code = jurisdiction_code
            assignment.country_code = country_code
            assignment.subdivision_code = subdivision_code
            assignment.timezone_name = timezone_name
            db.flush()
            return assignment

        assignment = EmployeePolicyAssignment(
            company_id=company_id,
            employee_id=employee_id,
            jurisdiction_code=jurisdiction_code,
            country_code=country_code,
            subdivision_code=subdivision_code,
            timezone_name=timezone_name,
        )
        db.add(assignment)
        db.flush()
        return assignment
