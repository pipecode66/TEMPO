from __future__ import annotations

import json
import math
from calendar import monthrange
from datetime import datetime, timezone
from typing import Any
from urllib import request as urllib_request

from sqlalchemy.orm import Session

from app.calculator import calcular_jornada_diaria
from app.core.exceptions import AppError
from app.db.models import (
    AttendanceRequest,
    Employee,
    PayrollConnector,
    TimeEntrySource,
    User,
    WorkLogStatus,
    Worksite,
    WorksiteQrToken,
)
from app.models import CalculoJornadaRequest, CalculoJornadaResponse, ConfiguracionJornada, Empleado
from app.repositories.attendance_request_repository import AttendanceRequestRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.payroll_connector_repository import PayrollConnectorRepository
from app.repositories.time_entry_repository import TimeEntryRepository
from app.repositories.worksite_repository import WorksiteRepository
from app.schemas.attendance import (
    AttendanceRequestResponse,
    CostProjectionResponse,
    EndShiftRequest,
    GeoCaptureRequest,
    StartShiftRequest,
)
from app.schemas.integration import ConnectorDispatchResponse
from app.schemas.time_entry import TimeEntryCreateRequest
from app.services.audit_service import record_audit_event
from app.services.time_entry_service import create_time_entry_with_calculation, serialize_time_entry


attendance_repository = AttendanceRequestRepository()
company_repository = CompanyRepository()
time_entry_repository = TimeEntryRepository()
worksite_repository = WorksiteRepository()
payroll_connector_repository = PayrollConnectorRepository()


def haversine_distance_meters(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    radius = 6_371_000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c


def extract_extra_cost(preview: dict[str, Any]) -> float:
    breakdown = preview.get("desglose_horas", {}) or {}
    return round(
        sum(
            max(float(item.get("valor_total", 0)) - float(item.get("valor_base", 0)), 0)
            for item in breakdown.values()
        ),
        2,
    )


def serialize_attendance_request(item: AttendanceRequest) -> AttendanceRequestResponse:
    preview = (
        CalculoJornadaResponse.model_validate(item.preview_json)
        if item.preview_json
        else None
    )
    return AttendanceRequestResponse(
        id=item.id,
        company_id=item.company_id,
        employee_id=item.employee_id,
        employee_name=item.employee.full_name,
        employee_email=item.employee.email,
        worksite_id=item.worksite_id,
        worksite_name=item.worksite.name if item.worksite else None,
        work_date=item.work_date,
        check_in_at=item.check_in_at,
        check_out_at=item.check_out_at,
        status=item.status.value if hasattr(item.status, "value") else str(item.status),
        verification_method=(
            item.verification_method.value
            if hasattr(item.verification_method, "value")
            else str(item.verification_method)
        ),
        notes=item.notes,
        justification=item.justification,
        requires_justification=item.requires_justification,
        approval_comment=item.approval_comment,
        approved_by_user_id=item.approved_by_user_id,
        approved_at=item.approved_at,
        projected_extra_cost=float(item.projected_extra_cost or 0),
        preview=preview,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def resolve_company_settings(db: Session, company_id: str) -> dict[str, Any]:
    company = company_repository.get(db, company_id)
    if not company:
        raise AppError("Empresa no encontrada.", code="company_not_found")
    return company.settings_json or {}


def resolve_jurisdiction_code(employee: Employee, company_settings: dict[str, Any]) -> str:
    if employee.policy_assignment:
        return employee.policy_assignment.jurisdiction_code
    return company_settings.get("jurisdiction_code", "co-national-2026")


def build_preview_request(
    *,
    employee: Employee,
    request_record: AttendanceRequest,
    company_settings: dict[str, Any],
) -> CalculoJornadaRequest:
    if not request_record.check_out_at:
        raise AppError("La jornada aun no ha sido finalizada.", code="attendance_not_finished")

    return CalculoJornadaRequest(
        empleado=Empleado(
            edad=employee.age,
            salario_base=float(employee.base_salary),
        ),
        hora_entrada=request_record.check_in_at.time().replace(second=0, microsecond=0),
        hora_salida=request_record.check_out_at.time().replace(second=0, microsecond=0),
        es_festivo=request_record.is_holiday,
        es_dominical=request_record.is_sunday,
        acumulado_semanal_horas=float(request_record.weekly_accumulated_hours),
        configuracion=ConfiguracionJornada(
            jurisdiction_code=resolve_jurisdiction_code(employee, company_settings),
            dias_laborales_semana=company_settings.get(
                "dias_laborales_semana", employee.work_days_per_week
            ),
            horas_semanales_pactadas=float(employee.weekly_hours),
            fecha_referencia_normativa=request_record.work_date,
            recargo_descanso_obligatorio=company_settings.get(
                "recargo_descanso_obligatorio"
            ),
        ),
    )


def ensure_geo_within_worksite(worksite: Worksite | None, geo: GeoCaptureRequest | None) -> None:
    if not worksite:
        return
    if not geo:
        raise AppError(
            "Debes compartir geolocalizacion para marcar en un sitio de trabajo con QR.",
            code="geo_required",
        )
    distance = haversine_distance_meters(
        worksite.latitude,
        worksite.longitude,
        geo.latitude,
        geo.longitude,
    )
    if distance > worksite.radius_meters:
        raise AppError(
            "La ubicacion reportada esta fuera del radio permitido del sitio de trabajo.",
            code="outside_worksite_radius",
        )


def resolve_worksite_for_start(
    db: Session,
    *,
    company_id: str,
    qr_token: str | None,
) -> tuple[Worksite | None, WorksiteQrToken | None]:
    if not qr_token:
        return None, None

    qr_entity = worksite_repository.get_qr_token(db, token=qr_token)
    if not qr_entity or qr_entity.company_id != company_id:
        raise AppError("El QR ya no es valido para esta empresa.", code="qr_invalid")
    return qr_entity.worksite, qr_entity


def start_shift(
    db: Session,
    *,
    current_user: User,
    employee: Employee,
    payload: StartShiftRequest,
) -> AttendanceRequest:
    if employee.status.value != "activo":
        raise AppError(
            "Solo los empleados activos pueden iniciar jornada.",
            code="employee_not_active",
        )
    open_request = attendance_repository.get_open_for_employee(
        db,
        company_id=current_user.company_id,
        employee_id=employee.id,
    )
    if open_request:
        raise AppError(
            "Ya existe una jornada abierta para este empleado.",
            code="attendance_already_open",
        )

    company_settings = resolve_company_settings(db, current_user.company_id)
    worksite, qr_entity = resolve_worksite_for_start(
        db,
        company_id=current_user.company_id,
        qr_token=payload.qr_token,
    )
    if company_settings.get("requires_qr_for_field") and not qr_entity:
        raise AppError(
            "La empresa exige QR para iniciar jornada en campo.",
            code="qr_required",
        )
    ensure_geo_within_worksite(worksite, payload.geo)

    now = datetime.now(timezone.utc)
    request_record = attendance_repository.create(
        db,
        company_id=current_user.company_id,
        employee_id=employee.id,
        submitted_by_user_id=current_user.id,
        worksite_id=worksite.id if worksite else None,
        qr_token_id=qr_entity.id if qr_entity else None,
        work_date=now.date(),
        check_in_at=now,
        check_in_latitude=payload.geo.latitude if payload.geo else None,
        check_in_longitude=payload.geo.longitude if payload.geo else None,
        check_in_accuracy_meters=payload.geo.accuracy_meters if payload.geo else None,
        verification_method="qr" if qr_entity else "direct",
        status=WorkLogStatus.OPEN,
        notes=payload.notes,
    )
    record_audit_event(
        db,
        actor=current_user,
        action="attendance.started",
        entity_type="attendance_request",
        entity_id=request_record.id,
        after={"employee_id": employee.id, "work_date": str(request_record.work_date)},
    )
    db.commit()
    db.refresh(request_record)
    return request_record


def end_shift(
    db: Session,
    *,
    current_user: User,
    employee: Employee,
    payload: EndShiftRequest,
) -> AttendanceRequest:
    request_record = attendance_repository.get_open_for_employee(
        db,
        company_id=current_user.company_id,
        employee_id=employee.id,
    )
    if not request_record:
        raise AppError(
            "No existe una jornada abierta para finalizar.",
            code="attendance_not_open",
        )

    ensure_geo_within_worksite(request_record.worksite, payload.geo)
    request_record.check_out_at = datetime.now(timezone.utc)
    request_record.check_out_latitude = payload.geo.latitude if payload.geo else None
    request_record.check_out_longitude = payload.geo.longitude if payload.geo else None
    request_record.check_out_accuracy_meters = (
        payload.geo.accuracy_meters if payload.geo else None
    )
    request_record.is_holiday = payload.is_holiday
    request_record.is_sunday = request_record.work_date.weekday() == 6

    company_settings = resolve_company_settings(db, current_user.company_id)
    request_record.weekly_accumulated_hours = (
        time_entry_repository.get_weekly_accumulated_hours_before(
            db,
            employee_id=employee.id,
            week_start=request_record.work_date,
            before_date=request_record.work_date,
        )
        if request_record.work_date.weekday() == 0
        else time_entry_repository.get_weekly_accumulated_hours_before(
            db,
            employee_id=employee.id,
            week_start=request_record.work_date.fromordinal(
                request_record.work_date.toordinal() - request_record.work_date.weekday()
            ),
            before_date=request_record.work_date,
        )
    )

    preview = calcular_jornada_diaria(
        build_preview_request(
            employee=employee,
            request_record=request_record,
            company_settings=company_settings,
        )
    )
    planned_daily_hours = float(employee.weekly_hours) / max(employee.work_days_per_week, 1)
    request_record.requires_justification = (
        preview.horas_totales_dia > planned_daily_hours
        or request_record.is_sunday
        or request_record.is_holiday
        or preview.alerta_limite_legal
    )
    if request_record.requires_justification and not (payload.justification or "").strip():
        raise AppError(
            "Debes justificar horas no programadas, festivos o turnos con alerta legal.",
            code="justification_required",
        )

    request_record.justification = payload.justification
    request_record.notes = payload.notes or request_record.notes
    request_record.preview_json = preview.model_dump()
    request_record.projected_extra_cost = preview.costo_extra_proyectado
    request_record.status = WorkLogStatus.PENDING

    record_audit_event(
        db,
        actor=current_user,
        action="attendance.submitted",
        entity_type="attendance_request",
        entity_id=request_record.id,
        after={"status": "pending", "projected_extra_cost": request_record.projected_extra_cost},
    )
    db.commit()
    db.refresh(request_record)
    return request_record


def approve_request(
    db: Session,
    *,
    current_user: User,
    request_record: AttendanceRequest,
    comment: str,
) -> AttendanceRequest:
    if request_record.status != WorkLogStatus.PENDING:
        raise AppError(
            "Solo las jornadas pendientes pueden aprobarse.",
            code="attendance_invalid_status",
        )
    company_settings = resolve_company_settings(db, current_user.company_id)

    time_entry = create_time_entry_with_calculation(
        db,
        actor=current_user,
        employee=request_record.employee,
        payload=TimeEntryCreateRequest(
            employee_id=request_record.employee_id,
            work_date=request_record.work_date,
            check_in=request_record.check_in_at.time().replace(second=0, microsecond=0),
            check_out=request_record.check_out_at.time().replace(second=0, microsecond=0),
            is_holiday=request_record.is_holiday,
            is_sunday=request_record.is_sunday,
            weekly_accumulated_hours=request_record.weekly_accumulated_hours,
            notes=request_record.notes or request_record.justification,
        ),
        company_settings=company_settings,
        source=TimeEntrySource.API,
    )

    request_record.status = WorkLogStatus.APPROVED
    request_record.approval_comment = comment
    request_record.approved_by_user_id = current_user.id
    request_record.approved_at = datetime.now(timezone.utc)
    request_record.time_entry_id = time_entry.id
    request_record.preview_json = serialize_time_entry(time_entry).calculation_result.model_dump()

    record_audit_event(
        db,
        actor=current_user,
        action="attendance.approved",
        entity_type="attendance_request",
        entity_id=request_record.id,
        after={"time_entry_id": time_entry.id},
    )
    db.commit()
    db.refresh(request_record)
    return request_record


def reject_request(
    db: Session,
    *,
    current_user: User,
    request_record: AttendanceRequest,
    comment: str,
) -> AttendanceRequest:
    if request_record.status != WorkLogStatus.PENDING:
        raise AppError(
            "Solo las jornadas pendientes pueden rechazarse.",
            code="attendance_invalid_status",
        )
    request_record.status = WorkLogStatus.REJECTED
    request_record.approval_comment = comment
    request_record.approved_by_user_id = current_user.id
    request_record.approved_at = datetime.now(timezone.utc)
    record_audit_event(
        db,
        actor=current_user,
        action="attendance.rejected",
        entity_type="attendance_request",
        entity_id=request_record.id,
        after={"status": "rejected"},
    )
    db.commit()
    db.refresh(request_record)
    return request_record


def build_cost_projection(
    *,
    month_prefix: str,
    approved_entries: list[Any],
    pending_requests: list[AttendanceRequest],
) -> CostProjectionResponse:
    actual_extra_cost = round(
        sum(
            extract_extra_cost(entry.calculation_result.model_dump())
            if hasattr(entry.calculation_result, "model_dump")
            else extract_extra_cost(entry.calculation_result)
            for entry in approved_entries
        ),
        2,
    )
    pending_extra_cost = round(
        sum(float(item.projected_extra_cost or 0) for item in pending_requests),
        2,
    )
    approved_hours = round(
        sum(float(entry.calculation_result.horas_totales_dia) for entry in approved_entries),
        2,
    )
    pending_hours = round(
        sum(
            float(item.preview_json.get("horas_totales_dia", 0))
            for item in pending_requests
            if item.preview_json
        ),
        2,
    )
    year, month = map(int, month_prefix.split("-"))
    today = datetime.now(timezone.utc).date()
    days_elapsed = max(1, today.day if today.year == year and today.month == month else monthrange(year, month)[1])
    month_days = monthrange(year, month)[1]
    projected_month_end = round(
        ((actual_extra_cost + pending_extra_cost) / days_elapsed) * month_days,
        2,
    )
    return CostProjectionResponse(
        month_label=month_prefix,
        actual_extra_cost=actual_extra_cost,
        pending_extra_cost=pending_extra_cost,
        projected_month_end_extra_cost=projected_month_end,
        approved_hours=approved_hours,
        pending_hours=pending_hours,
    )


def dispatch_connector_payload(
    db: Session,
    *,
    connector: PayrollConnector,
    payload: dict[str, Any],
) -> ConnectorDispatchResponse:
    data = json.dumps(payload).encode("utf-8")
    request = urllib_request.Request(
        connector.endpoint_url,
        data=data,
        headers={
            "Content-Type": "application/json",
            **(
                {"Authorization": f"Bearer {connector.auth_token}"}
                if connector.auth_token
                else {}
            ),
        },
        method="POST",
    )
    try:
        with urllib_request.urlopen(request, timeout=20) as response:
            connector.last_delivery_at = datetime.now(timezone.utc)
            connector.last_delivery_status = str(response.status)
            connector.last_delivery_error = None
            db.commit()
            return ConnectorDispatchResponse(
                connector_id=connector.id,
                status="sent",
                detail=f"Payload enviado con estado HTTP {response.status}.",
            )
    except Exception as exc:  # pragma: no cover - network dependent
        connector.last_delivery_at = datetime.now(timezone.utc)
        connector.last_delivery_status = "error"
        connector.last_delivery_error = str(exc)
        db.commit()
        return ConnectorDispatchResponse(
            connector_id=connector.id,
            status="error",
            detail=str(exc),
        )
