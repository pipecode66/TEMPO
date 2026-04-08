from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.models import User, UserRole
from app.db.session import get_db
from app.dependencies.auth import get_current_user, get_current_user_optional
from app.repositories.company_repository import CompanyRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthenticatedUser, LoginRequest, RegisterRequest, TokenResponse
from app.services.audit_service import record_audit_event


router = APIRouter(prefix="/auth", tags=["auth"])
user_repository = UserRepository()
company_repository = CompanyRepository()
settings = get_settings()


def serialize_user(user: User) -> AuthenticatedUser:
    return AuthenticatedUser(
        id=user.id,
        company_id=user.company_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        is_active=user.is_active,
        last_login_at=user.last_login_at,
    )


def set_auth_cookies(response: Response, *, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.access_cookie_name,
        value=access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(settings.access_cookie_name, path="/")
    response.delete_cookie(settings.refresh_cookie_name, path="/")


def build_default_company_settings() -> dict[str, object]:
    return {
        "jurisdiction_code": "co-national-2026",
        "country_code": "CO",
        "subdivision_code": None,
        "jornada_semanal_maxima": 42,
        "dias_laborales_semana": 5,
        "limite_extras_diarias": 2,
        "limite_extras_semanales": 12,
        "horario_nocturno_inicio": "19:00",
        "horario_nocturno_fin": "06:00",
        "alertas_automaticas": True,
        "cierre_semanal_automatico": False,
        "requires_qr_for_field": False,
        "recargo_descanso_obligatorio": 0.9,
        "fecha_normativa": "2026-07-15",
    }


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> TokenResponse:
    user = user_repository.get_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales invalidas.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario esta deshabilitado.",
        )

    user.last_login_at = datetime.now(timezone.utc)
    access_token = create_access_token(user.id, user.company_id, user.role.value)
    refresh_token = create_refresh_token(user.id, user.company_id, user.role.value)
    set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)
    record_audit_event(
        db,
        actor=user,
        action="auth.login",
        entity_type="session",
        metadata={"email": user.email},
    )
    db.commit()
    return TokenResponse(
        access_token_expires_in=settings.access_token_expire_minutes * 60,
        refresh_token_expires_in=settings.refresh_token_expire_days * 24 * 60 * 60,
        user=serialize_user(user),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    if company_repository.get_by_nit(db, payload.company_nit):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una empresa registrada con ese NIT.",
        )
    if user_repository.get_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta registrada con ese correo.",
        )

    company = company_repository.create(
        db,
        name=payload.company_name,
        nit=payload.company_nit,
        settings_json=build_default_company_settings(),
    )
    user = user_repository.create(
        db,
        company_id=company.id,
        email=payload.email.lower(),
        full_name=payload.full_name,
        role=UserRole.ADMIN,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    user.last_login_at = datetime.now(timezone.utc)

    access_token = create_access_token(user.id, user.company_id, user.role.value)
    refresh_token = create_refresh_token(user.id, user.company_id, user.role.value)
    set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)
    record_audit_event(
        db,
        actor=user,
        action="auth.register",
        entity_type="company",
        entity_id=company.id,
        after={"company_id": company.id, "company_name": company.name, "email": user.email},
    )
    db.commit()
    return TokenResponse(
        access_token_expires_in=settings.access_token_expire_minutes * 60,
        refresh_token_expires_in=settings.refresh_token_expire_days * 24 * 60 * 60,
        user=serialize_user(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_session(
    response: Response,
    db: Session = Depends(get_db),
    refresh_cookie: str | None = Cookie(default=None, alias=settings.refresh_cookie_name),
) -> TokenResponse:
    if not refresh_cookie:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No hay refresh token.")

    try:
        payload = decode_token(refresh_cookie)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invalido.")

    user = user_repository.get(db, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no disponible.")

    access_token = create_access_token(user.id, user.company_id, user.role.value)
    refresh_token = create_refresh_token(user.id, user.company_id, user.role.value)
    set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)
    return TokenResponse(
        access_token_expires_in=settings.access_token_expire_minutes * 60,
        refresh_token_expires_in=settings.refresh_token_expire_days * 24 * 60 * 60,
        user=serialize_user(user),
    )


@router.post("/logout")
def logout(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> dict[str, str]:
    clear_auth_cookies(response)
    if current_user:
        record_audit_event(
            db,
            actor=current_user,
            action="auth.logout",
            entity_type="session",
            metadata={"email": current_user.email},
        )
        db.commit()
    return {"message": "Sesion finalizada."}


@router.get("/me", response_model=AuthenticatedUser)
def me(current_user: User = Depends(get_current_user)) -> AuthenticatedUser:
    return serialize_user(current_user)
