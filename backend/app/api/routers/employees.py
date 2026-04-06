from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.db.models import User, UserRole
from app.db.session import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.employee import (
    EmployeeCreateRequest,
    EmployeeResponse,
    EmployeeUpdateRequest,
)
from app.services.audit_service import record_audit_event
from app.services.employee_service import serialize_employee


router = APIRouter(prefix="/employees", tags=["employees"])
employee_repository = EmployeeRepository()


@router.get("", response_model=list[EmployeeResponse])
def list_employees(
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[EmployeeResponse]:
    employees = employee_repository.list(
        db,
        company_id=current_user.company_id,
        search=search,
        status=status_filter,
    )
    return [serialize_employee(employee) for employee in employees]


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.NOMINA, UserRole.SUPERVISOR)
    ),
) -> EmployeeResponse:
    employee = employee_repository.create(
        db,
        company_id=current_user.company_id,
        external_code=payload.external_code,
        full_name=payload.full_name,
        email=payload.email,
        position=payload.position,
        area=payload.area,
        age=payload.age,
        base_salary=payload.base_salary,
        weekly_hours=payload.weekly_hours,
        work_days_per_week=payload.work_days_per_week,
        status=payload.status,
        created_by_id=current_user.id,
        updated_by_id=current_user.id,
    )
    record_audit_event(
        db,
        actor=current_user,
        action="employee.created",
        entity_type="employee",
        entity_id=employee.id,
        after=serialize_employee(employee).model_dump(),
    )
    db.commit()
    db.refresh(employee)
    return serialize_employee(employee)


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EmployeeResponse:
    employee = employee_repository.get(db, company_id=current_user.company_id, employee_id=employee_id)
    if not employee:
        raise AppError("Empleado no encontrado.", code="employee_not_found", status_code=status.HTTP_404_NOT_FOUND)
    return serialize_employee(employee)


@router.patch("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: str,
    payload: EmployeeUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.NOMINA, UserRole.SUPERVISOR)
    ),
) -> EmployeeResponse:
    employee = employee_repository.get(db, company_id=current_user.company_id, employee_id=employee_id)
    if not employee:
        raise AppError("Empleado no encontrado.", code="employee_not_found", status_code=status.HTTP_404_NOT_FOUND)

    before = serialize_employee(employee).model_dump()
    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(employee, field_name, value)
    employee.updated_by_id = current_user.id
    db.flush()
    record_audit_event(
        db,
        actor=current_user,
        action="employee.updated",
        entity_type="employee",
        entity_id=employee.id,
        before=before,
        after=serialize_employee(employee).model_dump(),
    )
    db.commit()
    db.refresh(employee)
    return serialize_employee(employee)


@router.delete("/{employee_id}")
def delete_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.NOMINA)),
) -> dict[str, str]:
    employee = employee_repository.get(db, company_id=current_user.company_id, employee_id=employee_id)
    if not employee:
        raise AppError("Empleado no encontrado.", code="employee_not_found", status_code=status.HTTP_404_NOT_FOUND)
    if employee_repository.has_time_entries(
        db,
        company_id=current_user.company_id,
        employee_id=employee_id,
    ):
        raise AppError(
            "No puedes eliminar un empleado con jornadas historicas. Cambia su estado a retirado.",
            code="employee_has_time_entries",
            status_code=status.HTTP_409_CONFLICT,
        )

    before = serialize_employee(employee).model_dump()
    employee_repository.delete(db, company_id=current_user.company_id, employee_id=employee_id)
    record_audit_event(
        db,
        actor=current_user,
        action="employee.deleted",
        entity_type="employee",
        entity_id=employee_id,
        before=before,
    )
    db.commit()
    return {"message": "Empleado eliminado."}
