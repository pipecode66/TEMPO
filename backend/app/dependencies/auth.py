from __future__ import annotations

from collections.abc import Callable

from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import decode_token
from app.db.models import Employee, User, UserRole
from app.db.session import get_db
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.user_repository import UserRepository


user_repository = UserRepository()
employee_repository = EmployeeRepository()


def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
    access_cookie: str | None = Cookie(default=None, alias=get_settings().access_cookie_name),
) -> User:
    token = access_cookie
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado.",
        )

    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acceso invalido.",
        )

    user = user_repository.get(db, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no disponible.",
        )
    return user


def get_current_user_optional(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
    access_cookie: str | None = Cookie(default=None, alias=get_settings().access_cookie_name),
) -> User | None:
    try:
        return get_current_user(
            db=db,
            authorization=authorization,
            access_cookie=access_cookie,
        )
    except HTTPException:
        return None


def require_roles(*allowed_roles: UserRole) -> Callable[[User], User]:
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ejecutar esta accion.",
            )
        return current_user

    return dependency


def require_portal_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.CONSULTA:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este modulo es exclusivo para autoservicio del empleado.",
        )
    return current_user


def get_current_employee(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_portal_user),
) -> Employee:
    employee = employee_repository.get_by_identity(
        db,
        company_id=current_user.company_id,
        email=current_user.email,
    )
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontro un empleado asociado a este usuario.",
        )
    return employee
