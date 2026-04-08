from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.core.exceptions import AppError
from app.db.models import User, UserRole
from app.db.session import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.legal_rules import resolve_jurisdiction_pack
from app.repositories.employee_policy_repository import EmployeePolicyRepository
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.user_repository import UserRepository
from app.schemas.employee import (
    EmployeeCreateRequest,
    EmployeePortalAccessRequest,
    EmployeeResponse,
    EmployeeUpdateRequest,
)
from app.services.audit_service import record_audit_event
from app.services.employee_service import serialize_employee


router = APIRouter(prefix="/employees", tags=["employees"])
employee_repository = EmployeeRepository()
employee_policy_repository = EmployeePolicyRepository()
user_repository = UserRepository()


def build_portal_lookup(db: Session, *, company_id: str) -> dict[str, User]:
    return {
        user.email.lower(): user
        for user in user_repository.list_by_company(db, company_id=company_id)
        if user.email and user.role == UserRole.CONSULTA and user.is_active
    }


def serialize_employee_with_context(
    employee,
    *,
    portal_lookup: dict[str, User],
) -> EmployeeResponse:
    employee.portal_access_enabled = bool(
        employee.email and employee.email.lower() in portal_lookup
    )
    return serialize_employee(employee)


def upsert_employee_policy(
    db: Session,
    *,
    company_id: str,
    employee_id: str,
    jurisdiction_code: str,
) -> None:
    pack = resolve_jurisdiction_pack(jurisdiction_code)
    employee_policy_repository.upsert(
        db,
        company_id=company_id,
        employee_id=employee_id,
        jurisdiction_code=pack.code,
        country_code=pack.country_code,
        subdivision_code=pack.subdivision_code,
    )


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
    portal_lookup = build_portal_lookup(db, company_id=current_user.company_id)
    return [
        serialize_employee_with_context(employee, portal_lookup=portal_lookup)
        for employee in employees
    ]


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
    upsert_employee_policy(
        db,
        company_id=current_user.company_id,
        employee_id=employee.id,
        jurisdiction_code=payload.jurisdiction_code,
    )
    portal_lookup = build_portal_lookup(db, company_id=current_user.company_id)
    serialized = serialize_employee_with_context(employee, portal_lookup=portal_lookup)
    record_audit_event(
        db,
        actor=current_user,
        action="employee.created",
        entity_type="employee",
        entity_id=employee.id,
        after=serialized.model_dump(),
    )
    db.commit()
    db.refresh(employee)
    return serialize_employee_with_context(
        employee,
        portal_lookup=build_portal_lookup(db, company_id=current_user.company_id),
    )


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EmployeeResponse:
    employee = employee_repository.get(db, company_id=current_user.company_id, employee_id=employee_id)
    if not employee:
        raise AppError("Empleado no encontrado.", code="employee_not_found", status_code=status.HTTP_404_NOT_FOUND)
    return serialize_employee_with_context(
        employee,
        portal_lookup=build_portal_lookup(db, company_id=current_user.company_id),
    )


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

    before = serialize_employee_with_context(
        employee,
        portal_lookup=build_portal_lookup(db, company_id=current_user.company_id),
    ).model_dump()
    update_data = payload.model_dump(exclude_unset=True)
    jurisdiction_code = update_data.pop("jurisdiction_code", None)
    for field_name, value in update_data.items():
        setattr(employee, field_name, value)
    if jurisdiction_code:
        upsert_employee_policy(
            db,
            company_id=current_user.company_id,
            employee_id=employee.id,
            jurisdiction_code=jurisdiction_code,
        )
    employee.updated_by_id = current_user.id
    db.flush()
    portal_lookup = build_portal_lookup(db, company_id=current_user.company_id)
    record_audit_event(
        db,
        actor=current_user,
        action="employee.updated",
        entity_type="employee",
        entity_id=employee.id,
        before=before,
        after=serialize_employee_with_context(
            employee,
            portal_lookup=portal_lookup,
        ).model_dump(),
    )
    db.commit()
    db.refresh(employee)
    return serialize_employee_with_context(employee, portal_lookup=portal_lookup)


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

    before = serialize_employee_with_context(
        employee,
        portal_lookup=build_portal_lookup(db, company_id=current_user.company_id),
    ).model_dump()
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


@router.post("/{employee_id}/portal-access", response_model=EmployeeResponse)
def provision_employee_portal_access(
    employee_id: str,
    payload: EmployeePortalAccessRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.NOMINA)),
) -> EmployeeResponse:
    employee = employee_repository.get(
        db,
        company_id=current_user.company_id,
        employee_id=employee_id,
    )
    if not employee:
        raise AppError(
            "Empleado no encontrado.",
            code="employee_not_found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    if not employee.email:
        raise AppError(
            "El empleado necesita un correo para habilitar autoservicio.",
            code="employee_email_required",
            status_code=status.HTTP_409_CONFLICT,
        )

    existing_user = user_repository.get_by_email(db, employee.email)
    if existing_user and existing_user.company_id != current_user.company_id:
        raise AppError(
            "Ese correo ya pertenece a otro usuario del sistema.",
            code="portal_email_conflict",
            status_code=status.HTTP_409_CONFLICT,
        )
    if existing_user and existing_user.role != UserRole.CONSULTA:
        raise AppError(
            "Ese correo ya tiene un acceso administrativo; usa un correo exclusivo para el portal.",
            code="portal_role_conflict",
            status_code=status.HTTP_409_CONFLICT,
        )

    if existing_user:
        existing_user.full_name = employee.full_name
        existing_user.password_hash = hash_password(payload.password)
        existing_user.is_active = True
    else:
        existing_user = user_repository.create(
            db,
            company_id=current_user.company_id,
            email=employee.email.lower(),
            full_name=employee.full_name,
            role=UserRole.CONSULTA,
            password_hash=hash_password(payload.password),
            is_active=True,
        )

    db.flush()
    portal_lookup = build_portal_lookup(db, company_id=current_user.company_id)
    record_audit_event(
        db,
        actor=current_user,
        action="employee.portal_access_enabled",
        entity_type="employee",
        entity_id=employee.id,
        after={
            "employee_id": employee.id,
            "portal_email": employee.email.lower(),
            "portal_user_id": existing_user.id,
        },
    )
    db.commit()
    db.refresh(employee)
    return serialize_employee_with_context(employee, portal_lookup=portal_lookup)
