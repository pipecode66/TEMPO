from __future__ import annotations

from app.db.models import Employee
from app.schemas.employee import EmployeeResponse


def serialize_employee(employee: Employee) -> EmployeeResponse:
    policy_assignment = getattr(employee, "policy_assignment", None)
    return EmployeeResponse(
        id=employee.id,
        company_id=employee.company_id,
        external_code=employee.external_code,
        full_name=employee.full_name,
        email=employee.email,
        position=employee.position,
        area=employee.area,
        age=employee.age,
        base_salary=float(employee.base_salary),
        weekly_hours=float(employee.weekly_hours),
        work_days_per_week=employee.work_days_per_week,
        status=employee.status.value if hasattr(employee.status, "value") else str(employee.status),
        jurisdiction_code=(
            policy_assignment.jurisdiction_code if policy_assignment else "co-national-2026"
        ),
        portal_access_enabled=bool(getattr(employee, "portal_access_enabled", False)),
        created_at=employee.created_at,
        updated_at=employee.updated_at,
    )
