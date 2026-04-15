from __future__ import annotations

import io
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.security import hash_password
from app.db.base import Base
from app.db.models import Company, User, UserRole
from app.db.session import get_db
from app.main import create_app


@pytest.fixture()
def session_factory(tmp_path) -> Generator[sessionmaker[Session], None, None]:
    database_path = tmp_path / "tempo-test.db"
    engine = create_engine(
        f"sqlite:///{database_path}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    TestingSessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        future=True,
    )
    Base.metadata.create_all(bind=engine)
    try:
        yield TestingSessionLocal
    finally:
        engine.dispose()


@pytest.fixture()
def seeded_identity(session_factory: sessionmaker[Session]) -> dict[str, str]:
    with session_factory() as db:
        company = Company(
            name="Tempo QA SAS",
            nit="900111222-3",
            sector="Servicios",
            headquarters="Bogota",
            payroll_contact_name="Nomina QA",
                payroll_contact_email="nomina@tempoqa.com",
            notes="Dataset de pruebas",
            settings_json={
                "jornada_semanal_maxima": 42,
                "dias_laborales_semana": 5,
                "limite_extras_diarias": 2,
                "limite_extras_semanales": 12,
                "horario_nocturno_inicio": "19:00",
                "horario_nocturno_fin": "06:00",
                "alertas_automaticas": True,
                "cierre_semanal_automatico": False,
                "recargo_descanso_obligatorio": 0.9,
                "fecha_normativa": "2026-07-15",
            },
        )
        db.add(company)
        db.flush()

        users = {
            "admin": User(
                company_id=company.id,
                email="admin@empresa.com",
                full_name="Admin Tempo",
                role=UserRole.ADMIN,
                password_hash=hash_password("Admin123!"),
                is_active=True,
            ),
            "nomina": User(
                company_id=company.id,
                email="nomina@empresa.com",
                full_name="Nomina Tempo",
                role=UserRole.NOMINA,
                password_hash=hash_password("Nomina123!"),
                is_active=True,
            ),
            "supervisor": User(
                company_id=company.id,
                email="supervisor@empresa.com",
                full_name="Supervisor Tempo",
                role=UserRole.SUPERVISOR,
                password_hash=hash_password("Supervisor123!"),
                is_active=True,
            ),
            "consulta": User(
                company_id=company.id,
                email="consulta@empresa.com",
                full_name="Consulta Tempo",
                role=UserRole.CONSULTA,
                password_hash=hash_password("Consulta123!"),
                is_active=True,
            ),
        }
        db.add_all(users.values())
        db.commit()

        return {
            "company_id": company.id,
            "admin_email": users["admin"].email,
            "admin_password": "Admin123!",
            "consulta_email": users["consulta"].email,
            "consulta_password": "Consulta123!",
        }


@pytest.fixture()
def client(session_factory: sessionmaker[Session], seeded_identity: dict[str, str]):
    del seeded_identity
    app = create_app()

    def override_get_db() -> Generator[Session, None, None]:
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client


def login(client: TestClient, *, email: str, password: str) -> dict:
    response = client.post(
        "/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_auth_flow_and_role_protection(
    client: TestClient,
    seeded_identity: dict[str, str],
) -> None:
    payload = login(
        client,
        email=seeded_identity["consulta_email"],
        password=seeded_identity["consulta_password"],
    )
    assert payload["user"]["role"] == "consulta"

    me_response = client.get("/v1/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["email"] == seeded_identity["consulta_email"]

    create_employee_response = client.post(
        "/v1/employees",
        json={
            "full_name": "Operario Consulta",
            "email": "operario.consulta@empresa.com",
            "position": "Operario",
            "area": "Produccion",
            "age": 26,
            "base_salary": 1800000,
            "weekly_hours": 42,
            "work_days_per_week": 5,
            "status": "activo",
        },
    )
    assert create_employee_response.status_code == 403

    logout_response = client.post("/v1/auth/logout")
    assert logout_response.status_code == 200


def test_register_creates_company_admin_and_session(client: TestClient) -> None:
    register_response = client.post(
        "/v1/auth/register",
        json={
            "company_name": "Campo Vivo SAS",
            "company_nit": "901555777-9",
            "full_name": "Andrea Admin",
            "email": "andrea@campovivo.com",
            "password": "Admin123!",
        },
    )
    assert register_response.status_code == 201, register_response.text
    payload = register_response.json()
    assert payload["user"]["role"] == "admin"
    assert payload["user"]["email"] == "andrea@campovivo.com"

    me_response = client.get("/v1/auth/me")
    assert me_response.status_code == 200, me_response.text
    assert me_response.json()["email"] == "andrea@campovivo.com"

    company_response = client.get("/v1/company")
    assert company_response.status_code == 200, company_response.text
    company_payload = company_response.json()
    assert company_payload["name"] == "Campo Vivo SAS"
    assert company_payload["nit"] == "901555777-9"
    assert company_payload["settings"]["jurisdiction_code"] == "co-national-2026"


def test_catalogs_jurisdictions_returns_supported_packs(
    client: TestClient,
    seeded_identity: dict[str, str],
) -> None:
    login(
        client,
        email=seeded_identity["admin_email"],
        password=seeded_identity["admin_password"],
    )

    response = client.get("/v1/catalogs/jurisdictions")
    assert response.status_code == 200, response.text
    payload = response.json()
    assert len(payload) >= 4
    assert any(item["code"] == "co-national-2026" for item in payload)
    assert all("daily_overtime_limit_hours" in item for item in payload)
    assert all("weekly_overtime_limit_hours" in item for item in payload)


def test_company_employee_time_entry_report_and_audit_flow(
    client: TestClient,
    seeded_identity: dict[str, str],
) -> None:
    login(
        client,
        email=seeded_identity["admin_email"],
        password=seeded_identity["admin_password"],
    )

    company_response = client.put(
        "/v1/company",
        json={
            "name": "Tempo QA SAS",
            "nit": "900111222-3",
            "sector": "Servicios",
            "headquarters": "Bogota",
            "payroll_contact_name": "Coordinacion Nomina",
            "payroll_contact_email": "coordinacion@tempoqa.com",
            "notes": "Empresa configurada para pruebas integrales",
            "settings": {
                "jornada_semanal_maxima": 42,
                "dias_laborales_semana": 5,
                "limite_extras_diarias": 2,
                "limite_extras_semanales": 12,
                "horario_nocturno_inicio": "19:00",
                "horario_nocturno_fin": "06:00",
                "alertas_automaticas": True,
                "cierre_semanal_automatico": False,
                "recargo_descanso_obligatorio": 0.9,
                "fecha_normativa": "2026-07-15",
            },
        },
    )
    assert company_response.status_code == 200, company_response.text

    employee_response = client.post(
        "/v1/employees",
        json={
            "external_code": "EMP-001",
            "full_name": "Laura Torres",
            "email": "laura.torres@empresa.com",
            "position": "Analista de nomina",
            "area": "Nomina",
            "age": 29,
            "base_salary": 2800000,
            "weekly_hours": 42,
            "work_days_per_week": 5,
            "status": "activo",
        },
    )
    assert employee_response.status_code == 201, employee_response.text
    employee_payload = employee_response.json()

    time_entry_response = client.post(
        "/v1/time-entries",
        json={
            "employee_id": employee_payload["id"],
            "work_date": "2026-04-06",
            "check_in": "08:00:00",
            "check_out": "17:00:00",
            "is_holiday": False,
            "is_sunday": False,
            "weekly_accumulated_hours": 0,
            "notes": "Turno base de validacion",
        },
    )
    assert time_entry_response.status_code == 201, time_entry_response.text
    time_entry_payload = time_entry_response.json()
    assert time_entry_payload["employee_name"] == "Laura Torres"
    assert time_entry_payload["calculation_result"]["valor_total_dia"] > 0

    report_response = client.get("/v1/reports")
    assert report_response.status_code == 200, report_response.text
    report_payload = report_response.json()
    assert report_payload["summary"]["total_employees"] == 1
    assert report_payload["summary"]["total_time_entries"] == 1
    assert report_payload["rows"][0]["employee_name"] == "Laura Torres"

    export_csv_response = client.get("/v1/reports/export.csv")
    assert export_csv_response.status_code == 200
    assert "text/csv" in export_csv_response.headers["content-type"]
    assert "Laura Torres" in export_csv_response.text

    calculation_response = client.post(
        "/v1/jornada/calcular",
        json={
            "empleado": {"edad": 29, "salario_base": 2800000},
            "hora_entrada": "08:00",
            "hora_salida": "17:00",
            "es_festivo": False,
            "es_dominical": False,
            "acumulado_semanal_horas": 0,
            "configuracion": {
                "dias_laborales_semana": 5,
                "horas_semanales_pactadas": 42,
                "fecha_referencia_normativa": "2026-04-06",
                "recargo_descanso_obligatorio": 0.9,
            },
        },
    )
    assert calculation_response.status_code == 200, calculation_response.text

    audit_response = client.get("/v1/audit-events")
    assert audit_response.status_code == 200, audit_response.text
    actions = {item["action"] for item in audit_response.json()}
    assert {"auth.login", "company.updated", "employee.created", "time_entry.created"} <= actions


def test_import_time_entries_returns_row_level_errors_and_csv(
    client: TestClient,
    seeded_identity: dict[str, str],
) -> None:
    login(
        client,
        email=seeded_identity["admin_email"],
        password=seeded_identity["admin_password"],
    )

    csv_content = "\n".join(
        [
            "employee_name,employee_email,area,position,age,base_salary,work_date,check_in,check_out,weekly_accumulated_hours",
            "Carlos Ruiz,carlos.ruiz@empresa.com,Operaciones,Auxiliar,31,1900000,2026-04-07,07:00,16:00,0",
            "Fila Mala,,Operaciones,Auxiliar,30,1900000,2026-04-08,xx,16:00,0",
        ]
    )

    import_response = client.post(
        "/v1/time-entries/import",
        files={"file": ("jornadas.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
        data={"create_missing_employees": "true"},
    )
    assert import_response.status_code == 201, import_response.text
    import_payload = import_response.json()
    assert import_payload["successful_rows"] == 1
    assert import_payload["rejected_rows"] == 1
    assert import_payload["errors"][0]["row_number"] == 3
    assert import_payload["error_report_download_url"]

    error_report_response = client.get(import_payload["error_report_download_url"])
    assert error_report_response.status_code == 200
    assert "row_number,reason,row_data" in error_report_response.text
    assert "Hora no valida" in error_report_response.text
