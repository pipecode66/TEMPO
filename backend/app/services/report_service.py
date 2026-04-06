from __future__ import annotations

import csv
import io
import json
from collections.abc import Sequence

from app.db.models import TimeEntry
from app.schemas.report import ReportResponse, ReportRow, ReportSummary


def build_report(entries: Sequence[TimeEntry], *, total_employees: int) -> ReportResponse:
    total_hours = sum(float(entry.calculation_result.total_day_hours) for entry in entries)
    total_value = sum(float(entry.calculation_result.total_day_value) for entry in entries)
    legal_alerts = sum(1 for entry in entries if entry.calculation_result.legal_alert)
    compliance_rate = 100.0 if not entries else round(((len(entries) - legal_alerts) / len(entries)) * 100, 2)

    rows = [
        ReportRow(
            time_entry_id=entry.id,
            employee_id=entry.employee_id,
            employee_name=entry.employee.full_name,
            area=entry.employee.area,
            work_date=entry.work_date.isoformat(),
            check_in=entry.check_in.strftime("%H:%M"),
            check_out=entry.check_out.strftime("%H:%M"),
            total_hours=float(entry.calculation_result.total_day_hours),
            total_value=float(entry.calculation_result.total_day_value),
            legal_alert=entry.calculation_result.legal_alert,
        )
        for entry in entries
    ]

    return ReportResponse(
        summary=ReportSummary(
            total_employees=total_employees,
            total_time_entries=len(entries),
            total_hours=round(total_hours, 4),
            total_value=round(total_value, 2),
            legal_alerts=legal_alerts,
            compliance_rate=compliance_rate,
        ),
        rows=rows,
    )


def export_report_csv(report: ReportResponse) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "time_entry_id",
            "employee_id",
            "employee_name",
            "area",
            "work_date",
            "check_in",
            "check_out",
            "total_hours",
            "total_value",
            "legal_alert",
        ]
    )

    for row in report.rows:
        writer.writerow(
            [
                row.time_entry_id,
                row.employee_id,
                row.employee_name,
                row.area,
                row.work_date,
                row.check_in,
                row.check_out,
                row.total_hours,
                row.total_value,
                "si" if row.legal_alert else "no",
            ]
        )
    return buffer.getvalue()


def export_report_json(report: ReportResponse) -> str:
    return json.dumps(report.model_dump(), ensure_ascii=True, indent=2)
