from __future__ import annotations

from datetime import timedelta
from typing import Any

from sqlalchemy.orm import Session

from app.calculator import calcular_jornada_diaria
from app.core.exceptions import AppError
from app.db.models import CalculationResult, Employee, TimeEntry, TimeEntrySource, User
from app.models import CalculoJornadaRequest, ConfiguracionJornada, Empleado
from app.repositories.calculation_result_repository import CalculationResultRepository
from app.repositories.time_entry_repository import TimeEntryRepository
from app.schemas.time_entry import TimeEntryCreateRequest, TimeEntryResponse, TimeEntryUpdateRequest
from app.services.audit_service import record_audit_event


time_entry_repository = TimeEntryRepository()
calculation_result_repository = CalculationResultRepository()


def start_of_week(value) -> Any:
    return value - timedelta(days=value.weekday())


def build_calculation_request(
    *,
    employee: Employee,
    payload: TimeEntryCreateRequest | TimeEntryUpdateRequest,
    company_settings: dict[str, Any],
    accumulated_hours: float,
) -> CalculoJornadaRequest:
    return CalculoJornadaRequest(
        empleado=Empleado(
            edad=getattr(payload, "override_employee_age", None) or employee.age,
            salario_base=getattr(payload, "override_employee_salary", None)
            or float(employee.base_salary),
        ),
        hora_entrada=payload.check_in,
        hora_salida=payload.check_out,
        es_festivo=payload.is_holiday,
        es_dominical=payload.is_sunday,
        acumulado_semanal_horas=accumulated_hours,
        configuracion=ConfiguracionJornada(
            dias_laborales_semana=company_settings.get(
                "dias_laborales_semana", employee.work_days_per_week
            ),
            horas_semanales_pactadas=employee.weekly_hours,
            fecha_referencia_normativa=payload.work_date,
            recargo_descanso_obligatorio=company_settings.get(
                "recargo_descanso_obligatorio"
            ),
        ),
    )


def create_time_entry_with_calculation(
    db: Session,
    *,
    actor: User,
    employee: Employee,
    payload: TimeEntryCreateRequest,
    company_settings: dict[str, Any],
    source: TimeEntrySource = TimeEntrySource.MANUAL,
) -> TimeEntry:
    duplicate = time_entry_repository.get_by_signature(
        db,
        company_id=actor.company_id,
        employee_id=employee.id,
        work_date=payload.work_date,
        check_in=payload.check_in,
        check_out=payload.check_out,
    )
    if duplicate:
        raise AppError(
            "Ya existe una jornada con el mismo empleado, fecha y rango horario.",
            code="time_entry_duplicate",
        )

    accumulated_hours = (
        payload.weekly_accumulated_hours
        if payload.weekly_accumulated_hours is not None
        else time_entry_repository.get_weekly_accumulated_hours_before(
            db,
            employee_id=employee.id,
            week_start=start_of_week(payload.work_date),
            before_date=payload.work_date,
        )
    )

    calculation_request = build_calculation_request(
        employee=employee,
        payload=payload,
        company_settings=company_settings,
        accumulated_hours=accumulated_hours,
    )
    calculation = calcular_jornada_diaria(calculation_request)

    entry = time_entry_repository.create(
        db,
        company_id=actor.company_id,
        employee_id=employee.id,
        work_date=payload.work_date,
        check_in=payload.check_in,
        check_out=payload.check_out,
        is_holiday=payload.is_holiday,
        is_sunday=payload.is_sunday,
        weekly_accumulated_hours=accumulated_hours,
        source=source,
        notes=payload.notes,
        created_by_id=actor.id,
        updated_by_id=actor.id,
    )

    calculation_result_repository.create(
        db,
        time_entry_id=entry.id,
        total_day_value=calculation.valor_total_dia,
        ordinary_hour_value=calculation.valor_hora_ordinaria,
        total_day_hours=calculation.horas_totales_dia,
        legal_alert=calculation.alerta_limite_legal,
        breakdown_json=calculation.model_dump()["desglose_horas"],
        alerts_json=calculation.alertas,
        rules_applied_json=calculation.reglas_aplicadas,
    )
    db.flush()
    db.refresh(entry)

    record_audit_event(
        db,
        actor=actor,
        action="time_entry.created",
        entity_type="time_entry",
        entity_id=entry.id,
        after={"employee_id": employee.id, "work_date": str(payload.work_date)},
    )
    return entry


def update_time_entry_with_calculation(
    db: Session,
    *,
    actor: User,
    entry: TimeEntry,
    payload: TimeEntryUpdateRequest,
    company_settings: dict[str, Any],
) -> TimeEntry:
    before = {
        "work_date": str(entry.work_date),
        "check_in": entry.check_in.strftime("%H:%M"),
        "check_out": entry.check_out.strftime("%H:%M"),
        "is_holiday": entry.is_holiday,
        "is_sunday": entry.is_sunday,
        "notes": entry.notes,
    }

    update_data = payload.model_dump(exclude_unset=True)
    for field_name, value in update_data.items():
        setattr(entry, field_name, value)
    if payload.weekly_accumulated_hours is None:
        entry.weekly_accumulated_hours = time_entry_repository.get_weekly_accumulated_hours_before(
            db,
            employee_id=entry.employee_id,
            week_start=start_of_week(entry.work_date),
            before_date=entry.work_date,
        )
    entry.updated_by_id = actor.id

    request_payload = TimeEntryCreateRequest(
        employee_id=entry.employee_id,
        work_date=entry.work_date,
        check_in=entry.check_in,
        check_out=entry.check_out,
        is_holiday=entry.is_holiday,
        is_sunday=entry.is_sunday,
        weekly_accumulated_hours=entry.weekly_accumulated_hours,
        notes=entry.notes,
    )
    calculation_request = build_calculation_request(
        employee=entry.employee,
        payload=request_payload,
        company_settings=company_settings,
        accumulated_hours=entry.weekly_accumulated_hours,
    )
    calculation = calcular_jornada_diaria(calculation_request)

    result: CalculationResult = entry.calculation_result
    result.total_day_value = calculation.valor_total_dia
    result.ordinary_hour_value = calculation.valor_hora_ordinaria
    result.total_day_hours = calculation.horas_totales_dia
    result.legal_alert = calculation.alerta_limite_legal
    result.breakdown_json = calculation.model_dump()["desglose_horas"]
    result.alerts_json = calculation.alertas
    result.rules_applied_json = calculation.reglas_aplicadas
    db.flush()
    db.refresh(entry)

    record_audit_event(
        db,
        actor=actor,
        action="time_entry.updated",
        entity_type="time_entry",
        entity_id=entry.id,
        before=before,
        after={"work_date": str(entry.work_date), "notes": entry.notes},
    )
    return entry


def serialize_time_entry(entry: TimeEntry) -> TimeEntryResponse:
    calculation = entry.calculation_result
    breakdown = calculation.breakdown_json or {}

    return TimeEntryResponse(
        id=entry.id,
        company_id=entry.company_id,
        employee_id=entry.employee_id,
        employee_name=entry.employee.full_name,
        area=entry.employee.area,
        work_date=entry.work_date,
        check_in=entry.check_in,
        check_out=entry.check_out,
        is_holiday=entry.is_holiday,
        is_sunday=entry.is_sunday,
        weekly_accumulated_hours=float(entry.weekly_accumulated_hours),
        source=entry.source.value if hasattr(entry.source, "value") else str(entry.source),
        notes=entry.notes,
        calculation_result={
            "valor_total_dia": float(calculation.total_day_value),
            "valor_hora_ordinaria": float(calculation.ordinary_hour_value),
            "horas_totales_dia": float(calculation.total_day_hours),
            "desglose_horas": breakdown,
            "alerta_limite_legal": calculation.legal_alert,
            "alertas": calculation.alerts_json or [],
            "reglas_aplicadas": calculation.rules_applied_json or {},
        },
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )
