from __future__ import annotations

from datetime import date, time
from enum import StrEnum
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Numeric,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, IdMixin, TimestampMixin, utcnow


class UserRole(StrEnum):
    ADMIN = "admin"
    NOMINA = "nomina"
    SUPERVISOR = "supervisor"
    CONSULTA = "consulta"


class EmployeeStatus(StrEnum):
    ACTIVO = "activo"
    LICENCIA = "licencia"
    RETIRADO = "retirado"


class TimeEntrySource(StrEnum):
    MANUAL = "manual"
    IMPORT = "import"
    API = "api"


class WorkLogStatus(StrEnum):
    OPEN = "open"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class VerificationMethod(StrEnum):
    DIRECT = "direct"
    QR = "qr"


def enum_values(enum_class: type[StrEnum]) -> list[str]:
    return [member.value for member in enum_class]


class Company(IdMixin, TimestampMixin, Base):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    nit: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    sector: Mapped[str | None] = mapped_column(String(255))
    headquarters: Mapped[str | None] = mapped_column(String(255))
    payroll_contact_name: Mapped[str | None] = mapped_column(String(255))
    payroll_contact_email: Mapped[str | None] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(Text)
    settings_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    users: Mapped[list["User"]] = relationship(back_populates="company")
    employees: Mapped[list["Employee"]] = relationship(back_populates="company")
    time_entries: Mapped[list["TimeEntry"]] = relationship(back_populates="company")
    audit_events: Mapped[list["AuditEvent"]] = relationship(back_populates="company")
    worksites: Mapped[list["Worksite"]] = relationship(back_populates="company")
    attendance_requests: Mapped[list["AttendanceRequest"]] = relationship(
        back_populates="company"
    )
    payroll_connectors: Mapped[list["PayrollConnector"]] = relationship(
        back_populates="company"
    )


class User(IdMixin, TimestampMixin, Base):
    __tablename__ = "users"

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(
            UserRole,
            values_callable=enum_values,
            native_enum=False,
            validate_strings=True,
        ),
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[Any | None] = mapped_column(DateTime(timezone=True), nullable=True)

    company: Mapped[Company] = relationship(back_populates="users")


class Employee(IdMixin, TimestampMixin, Base):
    __tablename__ = "employees"

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False)
    external_code: Mapped[str | None] = mapped_column(String(64))
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255))
    position: Mapped[str] = mapped_column(String(255), nullable=False)
    area: Mapped[str] = mapped_column(String(255), nullable=False)
    age: Mapped[int] = mapped_column(nullable=False)
    base_salary: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    weekly_hours: Mapped[float] = mapped_column(Float, nullable=False, default=42)
    work_days_per_week: Mapped[int] = mapped_column(nullable=False, default=5)
    status: Mapped[EmployeeStatus] = mapped_column(
        Enum(
            EmployeeStatus,
            values_callable=enum_values,
            native_enum=False,
            validate_strings=True,
        ),
        nullable=False,
        default=EmployeeStatus.ACTIVO,
    )
    created_by_id: Mapped[str | None] = mapped_column(String(36))
    updated_by_id: Mapped[str | None] = mapped_column(String(36))

    company: Mapped[Company] = relationship(back_populates="employees")
    time_entries: Mapped[list["TimeEntry"]] = relationship(back_populates="employee")
    attendance_requests: Mapped[list["AttendanceRequest"]] = relationship(
        back_populates="employee"
    )
    policy_assignment: Mapped["EmployeePolicyAssignment | None"] = relationship(
        back_populates="employee",
        cascade="all, delete-orphan",
        uselist=False,
    )


class TimeEntry(IdMixin, TimestampMixin, Base):
    __tablename__ = "time_entries"
    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "employee_id",
            "work_date",
            "check_in",
            "check_out",
            name="uq_time_entries_company_employee_shift",
        ),
    )

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False)
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id"), nullable=False)
    work_date: Mapped[date] = mapped_column(Date, nullable=False)
    check_in: Mapped[time] = mapped_column(Time, nullable=False)
    check_out: Mapped[time] = mapped_column(Time, nullable=False)
    is_holiday: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_sunday: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    weekly_accumulated_hours: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    source: Mapped[TimeEntrySource] = mapped_column(
        Enum(
            TimeEntrySource,
            values_callable=enum_values,
            native_enum=False,
            validate_strings=True,
        ),
        nullable=False,
        default=TimeEntrySource.MANUAL,
    )
    notes: Mapped[str | None] = mapped_column(Text)
    created_by_id: Mapped[str | None] = mapped_column(String(36))
    updated_by_id: Mapped[str | None] = mapped_column(String(36))

    company: Mapped[Company] = relationship(back_populates="time_entries")
    employee: Mapped[Employee] = relationship(back_populates="time_entries")
    calculation_result: Mapped["CalculationResult"] = relationship(
        back_populates="time_entry",
        cascade="all, delete-orphan",
        uselist=False,
    )


class CalculationResult(IdMixin, TimestampMixin, Base):
    __tablename__ = "calculation_results"

    time_entry_id: Mapped[str] = mapped_column(
        ForeignKey("time_entries.id"), nullable=False, unique=True
    )
    total_day_value: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    ordinary_hour_value: Mapped[float] = mapped_column(Float, nullable=False)
    total_day_hours: Mapped[float] = mapped_column(Float, nullable=False)
    legal_alert: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    breakdown_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    alerts_json: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    rules_applied_json: Mapped[dict[str, Any]] = mapped_column(
        JSON, default=dict, nullable=False
    )

    time_entry: Mapped[TimeEntry] = relationship(back_populates="calculation_result")


class AuditEvent(IdMixin, Base):
    __tablename__ = "audit_events"

    company_id: Mapped[str | None] = mapped_column(ForeignKey("companies.id"))
    actor_user_id: Mapped[str | None] = mapped_column(String(36))
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(36))
    before_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    after_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    metadata_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    created_at: Mapped[Any] = mapped_column(DateTime(timezone=True), default=utcnow)

    company: Mapped[Company | None] = relationship(back_populates="audit_events")


class Worksite(IdMixin, TimestampMixin, Base):
    __tablename__ = "worksites"

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    radius_meters: Mapped[float] = mapped_column(Float, nullable=False, default=150)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    company: Mapped[Company] = relationship(back_populates="worksites")
    qr_tokens: Mapped[list["WorksiteQrToken"]] = relationship(
        back_populates="worksite",
        cascade="all, delete-orphan",
    )
    attendance_requests: Mapped[list["AttendanceRequest"]] = relationship(
        back_populates="worksite"
    )


class WorksiteQrToken(IdMixin, TimestampMixin, Base):
    __tablename__ = "worksite_qr_tokens"

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False)
    worksite_id: Mapped[str] = mapped_column(ForeignKey("worksites.id"), nullable=False)
    token: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    expires_at: Mapped[Any | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_user_id: Mapped[str | None] = mapped_column(String(36))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    worksite: Mapped[Worksite] = relationship(back_populates="qr_tokens")
    attendance_requests: Mapped[list["AttendanceRequest"]] = relationship(
        back_populates="qr_token"
    )


class EmployeePolicyAssignment(IdMixin, TimestampMixin, Base):
    __tablename__ = "employee_policy_assignments"

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False)
    employee_id: Mapped[str] = mapped_column(
        ForeignKey("employees.id"), nullable=False, unique=True
    )
    jurisdiction_code: Mapped[str] = mapped_column(String(80), nullable=False)
    country_code: Mapped[str] = mapped_column(String(8), nullable=False)
    subdivision_code: Mapped[str | None] = mapped_column(String(16))
    timezone_name: Mapped[str | None] = mapped_column(String(64))

    employee: Mapped[Employee] = relationship(back_populates="policy_assignment")


class AttendanceRequest(IdMixin, TimestampMixin, Base):
    __tablename__ = "attendance_requests"

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False)
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id"), nullable=False)
    submitted_by_user_id: Mapped[str | None] = mapped_column(String(36))
    worksite_id: Mapped[str | None] = mapped_column(ForeignKey("worksites.id"))
    qr_token_id: Mapped[str | None] = mapped_column(ForeignKey("worksite_qr_tokens.id"))
    work_date: Mapped[date] = mapped_column(Date, nullable=False)
    check_in_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False)
    check_out_at: Mapped[Any | None] = mapped_column(DateTime(timezone=True))
    check_in_latitude: Mapped[float | None] = mapped_column(Float)
    check_in_longitude: Mapped[float | None] = mapped_column(Float)
    check_in_accuracy_meters: Mapped[float | None] = mapped_column(Float)
    check_out_latitude: Mapped[float | None] = mapped_column(Float)
    check_out_longitude: Mapped[float | None] = mapped_column(Float)
    check_out_accuracy_meters: Mapped[float | None] = mapped_column(Float)
    verification_method: Mapped[VerificationMethod] = mapped_column(
        Enum(
            VerificationMethod,
            values_callable=enum_values,
            native_enum=False,
            validate_strings=True,
        ),
        nullable=False,
        default=VerificationMethod.DIRECT,
    )
    is_holiday: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_sunday: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    weekly_accumulated_hours: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    justification: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    requires_justification: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[WorkLogStatus] = mapped_column(
        Enum(
            WorkLogStatus,
            values_callable=enum_values,
            native_enum=False,
            validate_strings=True,
        ),
        nullable=False,
        default=WorkLogStatus.OPEN,
    )
    approval_comment: Mapped[str | None] = mapped_column(Text)
    approved_by_user_id: Mapped[str | None] = mapped_column(String(36))
    approved_at: Mapped[Any | None] = mapped_column(DateTime(timezone=True))
    preview_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    projected_extra_cost: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    time_entry_id: Mapped[str | None] = mapped_column(String(36))

    company: Mapped[Company] = relationship(back_populates="attendance_requests")
    employee: Mapped[Employee] = relationship(back_populates="attendance_requests")
    worksite: Mapped[Worksite | None] = relationship(back_populates="attendance_requests")
    qr_token: Mapped[WorksiteQrToken | None] = relationship(
        back_populates="attendance_requests"
    )


class PayrollConnector(IdMixin, TimestampMixin, Base):
    __tablename__ = "payroll_connectors"

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[str] = mapped_column(String(80), nullable=False)
    endpoint_url: Mapped[str] = mapped_column(String(500), nullable=False)
    auth_token: Mapped[str | None] = mapped_column(String(255))
    payload_format: Mapped[str] = mapped_column(String(40), nullable=False, default="json")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_delivery_at: Mapped[Any | None] = mapped_column(DateTime(timezone=True))
    last_delivery_status: Mapped[str | None] = mapped_column(String(40))
    last_delivery_error: Mapped[str | None] = mapped_column(Text)

    company: Mapped[Company] = relationship(back_populates="payroll_connectors")
