from __future__ import annotations

from dataclasses import dataclass
from datetime import date, time


NIGHT_SHIFT_REFORM_EFFECTIVE = date(2025, 12, 25)
REST_DAY_SURCHARGE_80 = date(2025, 7, 1)
REST_DAY_SURCHARGE_90 = date(2026, 7, 1)
REST_DAY_SURCHARGE_100 = date(2027, 7, 1)

WEEKLY_LIMIT_47 = date(2023, 7, 15)
WEEKLY_LIMIT_46 = date(2024, 7, 15)
WEEKLY_LIMIT_44 = date(2025, 7, 15)
WEEKLY_LIMIT_42 = date(2026, 7, 15)


@dataclass(frozen=True)
class LegalRates:
    reference_date: date
    weekly_limit_hours: float
    night_start: time
    night_end: time
    night_surcharge: float
    overtime_day_surcharge: float
    overtime_night_surcharge: float
    rest_day_surcharge: float
    daily_overtime_limit_hours: float
    weekly_overtime_limit_hours: float
    minor_daily_limit_hours: float
    minor_weekly_limit_hours: float
    minor_latest_end: time


def get_weekly_limit(reference_date: date) -> float:
    if reference_date >= WEEKLY_LIMIT_42:
        return 42.0
    if reference_date >= WEEKLY_LIMIT_44:
        return 44.0
    if reference_date >= WEEKLY_LIMIT_46:
        return 46.0
    if reference_date >= WEEKLY_LIMIT_47:
        return 47.0
    return 48.0


def get_rest_day_surcharge(reference_date: date) -> float:
    if reference_date >= REST_DAY_SURCHARGE_100:
        return 1.00
    if reference_date >= REST_DAY_SURCHARGE_90:
        return 0.90
    if reference_date >= REST_DAY_SURCHARGE_80:
        return 0.80
    return 0.75


def get_night_window(reference_date: date) -> tuple[time, time]:
    if reference_date >= NIGHT_SHIFT_REFORM_EFFECTIVE:
        return time(19, 0), time(6, 0)
    return time(21, 0), time(6, 0)


def get_legal_rates(reference_date: date) -> LegalRates:
    night_start, night_end = get_night_window(reference_date)

    return LegalRates(
        reference_date=reference_date,
        weekly_limit_hours=get_weekly_limit(reference_date),
        night_start=night_start,
        night_end=night_end,
        night_surcharge=0.35,
        overtime_day_surcharge=0.25,
        overtime_night_surcharge=0.75,
        rest_day_surcharge=get_rest_day_surcharge(reference_date),
        daily_overtime_limit_hours=2.0,
        weekly_overtime_limit_hours=12.0,
        minor_daily_limit_hours=6.0,
        minor_weekly_limit_hours=30.0,
        minor_latest_end=time(18, 0),
    )
