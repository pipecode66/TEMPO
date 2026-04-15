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
class JurisdictionPack:
    code: str
    name: str
    country_code: str
    subdivision_code: str | None
    daily_overtime_limit_hours: float
    weekly_overtime_limit_hours: float


@dataclass(frozen=True)
class LegalRates:
    reference_date: date
    jurisdiction: JurisdictionPack
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


JURISDICTION_PACKS: dict[str, JurisdictionPack] = {
    "co-national-2026": JurisdictionPack(
        code="co-national-2026",
        name="Colombia nacional 2026",
        country_code="CO",
        subdivision_code=None,
        daily_overtime_limit_hours=2.0,
        weekly_overtime_limit_hours=12.0,
    ),
    "co-bogota-2026": JurisdictionPack(
        code="co-bogota-2026",
        name="Colombia Bogota 2026",
        country_code="CO",
        subdivision_code="DC",
        daily_overtime_limit_hours=2.0,
        weekly_overtime_limit_hours=12.0,
    ),
    "mx-federal-2026": JurisdictionPack(
        code="mx-federal-2026",
        name="Mexico federal 2026",
        country_code="MX",
        subdivision_code=None,
        daily_overtime_limit_hours=3.0,
        weekly_overtime_limit_hours=9.0,
    ),
    "us-ca-2026": JurisdictionPack(
        code="us-ca-2026",
        name="Estados Unidos California 2026",
        country_code="US",
        subdivision_code="CA",
        daily_overtime_limit_hours=4.0,
        weekly_overtime_limit_hours=20.0,
    ),
}


def get_weekly_limit_colombia(reference_date: date) -> float:
    if reference_date >= WEEKLY_LIMIT_42:
        return 42.0
    if reference_date >= WEEKLY_LIMIT_44:
        return 44.0
    if reference_date >= WEEKLY_LIMIT_46:
        return 46.0
    if reference_date >= WEEKLY_LIMIT_47:
        return 47.0
    return 48.0


def get_rest_day_surcharge_colombia(reference_date: date) -> float:
    if reference_date >= REST_DAY_SURCHARGE_100:
        return 1.00
    if reference_date >= REST_DAY_SURCHARGE_90:
        return 0.90
    if reference_date >= REST_DAY_SURCHARGE_80:
        return 0.80
    return 0.75


def get_night_window_colombia(reference_date: date) -> tuple[time, time]:
    if reference_date >= NIGHT_SHIFT_REFORM_EFFECTIVE:
        return time(19, 0), time(6, 0)
    return time(21, 0), time(6, 0)


def get_supported_jurisdictions() -> list[JurisdictionPack]:
    return list(JURISDICTION_PACKS.values())


def resolve_jurisdiction_pack(jurisdiction_code: str) -> JurisdictionPack:
    return JURISDICTION_PACKS.get(jurisdiction_code, JURISDICTION_PACKS["co-national-2026"])


def get_legal_rates(reference_date: date, jurisdiction_code: str = "co-national-2026") -> LegalRates:
    jurisdiction = resolve_jurisdiction_pack(jurisdiction_code)

    if jurisdiction.code.startswith("co-"):
        night_start, night_end = get_night_window_colombia(reference_date)
        return LegalRates(
            reference_date=reference_date,
            jurisdiction=jurisdiction,
            weekly_limit_hours=get_weekly_limit_colombia(reference_date),
            night_start=night_start,
            night_end=night_end,
            night_surcharge=0.35,
            overtime_day_surcharge=0.25,
            overtime_night_surcharge=0.75,
            rest_day_surcharge=get_rest_day_surcharge_colombia(reference_date),
            daily_overtime_limit_hours=2.0,
            weekly_overtime_limit_hours=12.0,
            minor_daily_limit_hours=6.0,
            minor_weekly_limit_hours=30.0,
            minor_latest_end=time(18, 0),
        )

    if jurisdiction.code == "mx-federal-2026":
        return LegalRates(
            reference_date=reference_date,
            jurisdiction=jurisdiction,
            weekly_limit_hours=48.0,
            night_start=time(20, 0),
            night_end=time(6, 0),
            night_surcharge=0.30,
            overtime_day_surcharge=1.00,
            overtime_night_surcharge=1.25,
            rest_day_surcharge=0.25,
            daily_overtime_limit_hours=3.0,
            weekly_overtime_limit_hours=9.0,
            minor_daily_limit_hours=6.0,
            minor_weekly_limit_hours=36.0,
            minor_latest_end=time(20, 0),
        )

    if jurisdiction.code == "us-ca-2026":
        return LegalRates(
            reference_date=reference_date,
            jurisdiction=jurisdiction,
            weekly_limit_hours=40.0,
            night_start=time(22, 0),
            night_end=time(6, 0),
            night_surcharge=0.15,
            overtime_day_surcharge=0.50,
            overtime_night_surcharge=1.00,
            rest_day_surcharge=0.50,
            daily_overtime_limit_hours=4.0,
            weekly_overtime_limit_hours=20.0,
            minor_daily_limit_hours=6.0,
            minor_weekly_limit_hours=30.0,
            minor_latest_end=time(20, 0),
        )

    raise ValueError(f"No existe un paquete legal configurado para {jurisdiction.code}.")
