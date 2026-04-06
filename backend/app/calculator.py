from __future__ import annotations

from collections import defaultdict
from datetime import datetime, time, timedelta

from .legal_rules import LegalRates, get_legal_rates
from .models import (
    CalculoJornadaRequest,
    CalculoJornadaResponse,
    DesgloseItem,
    Empleado,
)


CATEGORY_LABELS = {
    "ordinarias_diurnas": "Horas ordinarias diurnas",
    "recargo_nocturno": "Horas ordinarias con recargo nocturno",
    "dominical_festivo_diurno": "Horas diurnas en descanso obligatorio",
    "dominical_festivo_nocturno": "Horas nocturnas en descanso obligatorio",
    "extra_diurna": "Horas extra diurnas",
    "extra_nocturna": "Horas extra nocturnas",
    "extra_diurna_dominical_festivo": "Horas extra diurnas en descanso obligatorio",
    "extra_nocturna_dominical_festivo": "Horas extra nocturnas en descanso obligatorio",
}


def is_night_hour(value: time, rates: LegalRates) -> bool:
    if rates.night_start < rates.night_end:
        return rates.night_start <= value < rates.night_end
    return value >= rates.night_start or value < rates.night_end


def is_minor_day_window(value: time, latest_end: time) -> bool:
    return time(6, 0) <= value < latest_end


def resolve_weekly_ordinary_limit(request: CalculoJornadaRequest, rates: LegalRates) -> float:
    agreed = request.configuracion.horas_semanales_pactadas or rates.weekly_limit_hours
    legal_limit = (
        rates.minor_weekly_limit_hours
        if request.empleado.es_menor_protegido
        else rates.weekly_limit_hours
    )

    if agreed > legal_limit:
        raise ValueError(
            f"El tope semanal pactado ({agreed}) supera el limite legal aplicable ({legal_limit})."
        )

    return agreed


def resolve_daily_ordinary_limit(
    request: CalculoJornadaRequest,
    rates: LegalRates,
    weekly_limit: float,
) -> float:
    empleado = request.empleado
    agreed = request.configuracion.horas_diarias_pactadas

    if empleado.es_menor_protegido:
        if agreed is not None and agreed > rates.minor_daily_limit_hours:
            raise ValueError(
                "Los adolescentes de 15 a 17 anos no pueden pactar mas de 6 horas diarias."
            )
        return agreed or rates.minor_daily_limit_hours

    if agreed is not None:
        if agreed > 9:
            raise ValueError(
                "La jornada diaria pactada no puede exceder 9 horas en la distribucion flexible."
            )
        return agreed

    derived = weekly_limit / request.configuracion.dias_laborales_semana
    if derived > 9:
        raise ValueError(
            "La distribucion configurada excede el maximo de 9 horas diarias permitido por la ley."
        )
    return derived


def resolve_hourly_rate(request: CalculoJornadaRequest, weekly_limit: float) -> float:
    divisor = request.configuracion.divisor_hora_mensual
    if divisor is None:
        divisor = round((weekly_limit * 52) / 12, 4)
    return round(request.empleado.salario_base / divisor, 4)


def get_category_surcharge(key: str, rates: LegalRates, request: CalculoJornadaRequest) -> float:
    rest_surcharge = (
        request.configuracion.recargo_descanso_obligatorio
        if request.configuracion.recargo_descanso_obligatorio is not None
        else rates.rest_day_surcharge
    )

    surcharge_map = {
        "ordinarias_diurnas": 0.0,
        "recargo_nocturno": rates.night_surcharge,
        "dominical_festivo_diurno": rest_surcharge,
        "dominical_festivo_nocturno": rest_surcharge + rates.night_surcharge,
        "extra_diurna": rates.overtime_day_surcharge,
        "extra_nocturna": rates.overtime_night_surcharge,
        "extra_diurna_dominical_festivo": rest_surcharge + rates.overtime_day_surcharge,
        "extra_nocturna_dominical_festivo": rest_surcharge + rates.overtime_night_surcharge,
    }
    return surcharge_map[key]


def classify_minute(
    request: CalculoJornadaRequest,
    is_extra: bool,
    is_night: bool,
) -> str:
    if request.es_descanso_obligatorio:
        if is_extra:
            return (
                "extra_nocturna_dominical_festivo"
                if is_night
                else "extra_diurna_dominical_festivo"
            )
        return "dominical_festivo_nocturno" if is_night else "dominical_festivo_diurno"

    if is_extra:
        return "extra_nocturna" if is_night else "extra_diurna"

    if is_night:
        return "recargo_nocturno"

    return "ordinarias_diurnas"


def collect_alerts(
    request: CalculoJornadaRequest,
    rates: LegalRates,
    weekly_limit: float,
    daily_limit: float,
    total_hours: float,
    shift_extra_hours: float,
    shift_crossed_minor_window: bool,
) -> list[str]:
    empleado: Empleado = request.empleado
    prior_hours = float(request.acumulado_semanal_horas)
    prior_extra_hours = max(prior_hours - weekly_limit, 0.0)
    weekly_total = prior_hours + total_hours
    weekly_extra_total = prior_extra_hours + shift_extra_hours
    alerts: list[str] = []

    if empleado.es_menor_protegido:
        if total_hours > rates.minor_daily_limit_hours:
            alerts.append(
                "El turno supera el maximo legal diario de 6 horas para adolescentes de 15 a 17 anos."
            )
        if weekly_total > rates.minor_weekly_limit_hours:
            alerts.append(
                "El acumulado semanal supera el maximo legal de 30 horas para adolescentes de 15 a 17 anos."
            )
        if shift_extra_hours > 0:
            alerts.append(
                "Los adolescentes de 15 a 17 anos no pueden laborar horas extra."
            )
        if shift_crossed_minor_window:
            alerts.append(
                "Los adolescentes de 15 a 17 anos solo pueden laborar en jornada diurna y hasta las 18:00."
            )
        return alerts

    if request.acumulado_semanal_horas > weekly_limit:
        alerts.append(
            "El acumulado semanal recibido ya supera la jornada ordinaria semanal pactada o legal."
        )
    if shift_extra_hours > rates.daily_overtime_limit_hours:
        alerts.append(
            "El turno excede el maximo de 2 horas extra diarias permitido por la ley."
        )
    if weekly_extra_total > rates.weekly_overtime_limit_hours:
        alerts.append(
            "El acumulado de horas extra supera el maximo legal de 12 horas semanales."
        )
    if daily_limit > 9:
        alerts.append(
            "La jornada diaria pactada supera el limite flexible de 9 horas diarias."
        )

    return alerts


def calcular_jornada_diaria(request: CalculoJornadaRequest) -> CalculoJornadaResponse:
    rates = get_legal_rates(request.configuracion.fecha_referencia_normativa)
    weekly_limit = resolve_weekly_ordinary_limit(request, rates)
    daily_limit = resolve_daily_ordinary_limit(request, rates, weekly_limit)
    hourly_rate = resolve_hourly_rate(request, weekly_limit)

    start_dt = datetime.combine(rates.reference_date, request.hora_entrada)
    end_dt = datetime.combine(rates.reference_date, request.hora_salida)
    if end_dt <= start_dt:
        end_dt += timedelta(days=1)

    bucket_minutes: dict[str, int] = defaultdict(int)
    worked_minutes = 0
    extra_minutes = 0
    shift_crossed_minor_window = False

    cursor = start_dt
    while cursor < end_dt:
        worked_hours_so_far = worked_minutes / 60
        weekly_hours_so_far = float(request.acumulado_semanal_horas) + worked_hours_so_far
        minute_is_extra = (
            worked_hours_so_far >= daily_limit or weekly_hours_so_far >= weekly_limit
        )
        minute_is_night = is_night_hour(cursor.time(), rates)

        if request.empleado.es_menor_protegido and not is_minor_day_window(
            cursor.time(), rates.minor_latest_end
        ):
            shift_crossed_minor_window = True

        category = classify_minute(request, minute_is_extra, minute_is_night)
        bucket_minutes[category] += 1
        worked_minutes += 1
        if minute_is_extra:
            extra_minutes += 1
        cursor += timedelta(minutes=1)

    total_hours = round(worked_minutes / 60, 4)
    shift_extra_hours = round(extra_minutes / 60, 4)
    alerts = collect_alerts(
        request=request,
        rates=rates,
        weekly_limit=weekly_limit,
        daily_limit=daily_limit,
        total_hours=total_hours,
        shift_extra_hours=shift_extra_hours,
        shift_crossed_minor_window=shift_crossed_minor_window,
    )

    breakdown: dict[str, DesgloseItem] = {}
    total_value = 0.0

    for key, minutes in bucket_minutes.items():
        hours = round(minutes / 60, 4)
        surcharge = get_category_surcharge(key, rates, request)
        factor_total = round(1 + surcharge, 4)
        base_value = round(hours * hourly_rate, 2)
        total_category_value = round(hours * hourly_rate * factor_total, 2)
        total_value += total_category_value
        breakdown[key] = DesgloseItem(
            etiqueta=CATEGORY_LABELS[key],
            horas=hours,
            recargo_porcentual=round(surcharge, 4),
            factor_total=factor_total,
            valor_base=base_value,
            valor_total=total_category_value,
        )

    applied_rest_surcharge = (
        request.configuracion.recargo_descanso_obligatorio
        if request.configuracion.recargo_descanso_obligatorio is not None
        else rates.rest_day_surcharge
    )

    return CalculoJornadaResponse(
        valor_total_dia=round(total_value, 2),
        valor_hora_ordinaria=round(hourly_rate, 4),
        horas_totales_dia=total_hours,
        desglose_horas=breakdown,
        alerta_limite_legal=bool(alerts),
        alertas=alerts,
        reglas_aplicadas={
            "fecha_referencia_normativa": rates.reference_date.isoformat(),
            "jornada_ordinaria_maxima_semanal": weekly_limit,
            "jornada_diaria_pactada": round(daily_limit, 4),
            "limite_horas_extra_diarias": rates.daily_overtime_limit_hours,
            "limite_horas_extra_semanales": rates.weekly_overtime_limit_hours,
            "horario_nocturno": f"{rates.night_start.strftime('%H:%M')} - {rates.night_end.strftime('%H:%M')}",
            "recargo_nocturno": rates.night_surcharge,
            "hora_extra_diurna": 1 + rates.overtime_day_surcharge,
            "hora_extra_nocturna": 1 + rates.overtime_night_surcharge,
            "descanso_obligatorio": 1 + applied_rest_surcharge,
            "hora_extra_diurna_descanso_obligatorio": 1
            + applied_rest_surcharge
            + rates.overtime_day_surcharge,
            "hora_extra_nocturna_descanso_obligatorio": 1
            + applied_rest_surcharge
            + rates.overtime_night_surcharge,
            "proteccion_menores_15_17": {
                "maximo_diario": rates.minor_daily_limit_hours,
                "maximo_semanal": rates.minor_weekly_limit_hours,
                "sin_horas_extra": True,
                "limite_horario": f"06:00 - {rates.minor_latest_end.strftime('%H:%M')}",
            },
        },
    )
