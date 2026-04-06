"""Initial Tempo production schema."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260406_000001"
down_revision = None
branch_labels = None
depends_on = None


user_role = sa.Enum(
    "admin",
    "nomina",
    "supervisor",
    "consulta",
    name="userrole",
    native_enum=False,
)
employee_status = sa.Enum(
    "activo",
    "licencia",
    "retirado",
    name="employeestatus",
    native_enum=False,
)
time_entry_source = sa.Enum(
    "manual",
    "import",
    "api",
    name="timeentrysource",
    native_enum=False,
)


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("nit", sa.String(length=64), nullable=False),
        sa.Column("sector", sa.String(length=255), nullable=True),
        sa.Column("headquarters", sa.String(length=255), nullable=True),
        sa.Column("payroll_contact_name", sa.String(length=255), nullable=True),
        sa.Column("payroll_contact_email", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("settings_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nit"),
    )
    op.create_table(
        "users",
        sa.Column("company_id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_company_id", "users", ["company_id"], unique=False)

    op.create_table(
        "employees",
        sa.Column("company_id", sa.String(length=36), nullable=False),
        sa.Column("external_code", sa.String(length=64), nullable=True),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("position", sa.String(length=255), nullable=False),
        sa.Column("area", sa.String(length=255), nullable=False),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.Column("base_salary", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("weekly_hours", sa.Float(), nullable=False),
        sa.Column("work_days_per_week", sa.Integer(), nullable=False),
        sa.Column("status", employee_status, nullable=False),
        sa.Column("created_by_id", sa.String(length=36), nullable=True),
        sa.Column("updated_by_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_employees_company_id", "employees", ["company_id"], unique=False)
    op.create_index("ix_employees_area", "employees", ["area"], unique=False)

    op.create_table(
        "time_entries",
        sa.Column("company_id", sa.String(length=36), nullable=False),
        sa.Column("employee_id", sa.String(length=36), nullable=False),
        sa.Column("work_date", sa.Date(), nullable=False),
        sa.Column("check_in", sa.Time(), nullable=False),
        sa.Column("check_out", sa.Time(), nullable=False),
        sa.Column("is_holiday", sa.Boolean(), nullable=False),
        sa.Column("is_sunday", sa.Boolean(), nullable=False),
        sa.Column("weekly_accumulated_hours", sa.Float(), nullable=False),
        sa.Column("source", time_entry_source, nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.String(length=36), nullable=True),
        sa.Column("updated_by_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "company_id",
            "employee_id",
            "work_date",
            "check_in",
            "check_out",
            name="uq_time_entries_company_employee_shift",
        ),
    )
    op.create_index(
        "ix_time_entries_company_work_date",
        "time_entries",
        ["company_id", "work_date"],
        unique=False,
    )
    op.create_index("ix_time_entries_employee_id", "time_entries", ["employee_id"], unique=False)

    op.create_table(
        "calculation_results",
        sa.Column("time_entry_id", sa.String(length=36), nullable=False),
        sa.Column("total_day_value", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("ordinary_hour_value", sa.Float(), nullable=False),
        sa.Column("total_day_hours", sa.Float(), nullable=False),
        sa.Column("legal_alert", sa.Boolean(), nullable=False),
        sa.Column("breakdown_json", sa.JSON(), nullable=False),
        sa.Column("alerts_json", sa.JSON(), nullable=False),
        sa.Column("rules_applied_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["time_entry_id"], ["time_entries.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("time_entry_id"),
    )

    op.create_table(
        "audit_events",
        sa.Column("company_id", sa.String(length=36), nullable=True),
        sa.Column("actor_user_id", sa.String(length=36), nullable=True),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("entity_type", sa.String(length=120), nullable=False),
        sa.Column("entity_id", sa.String(length=36), nullable=True),
        sa.Column("before_json", sa.JSON(), nullable=True),
        sa.Column("after_json", sa.JSON(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_audit_events_company_created_at",
        "audit_events",
        ["company_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_audit_events_company_created_at", table_name="audit_events")
    op.drop_table("audit_events")
    op.drop_table("calculation_results")
    op.drop_index("ix_time_entries_employee_id", table_name="time_entries")
    op.drop_index("ix_time_entries_company_work_date", table_name="time_entries")
    op.drop_table("time_entries")
    op.drop_index("ix_employees_area", table_name="employees")
    op.drop_index("ix_employees_company_id", table_name="employees")
    op.drop_table("employees")
    op.drop_index("ix_users_company_id", table_name="users")
    op.drop_table("users")
    op.drop_table("companies")
