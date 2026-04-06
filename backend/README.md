# Tempo API

Backend productivo para control de tiempos en Colombia. Conserva el motor legal existente y le agrega autenticacion real, persistencia, auditoria, importacion masiva y reportes operativos.

## Componentes

- `app/main.py`: app FastAPI, middlewares, errores, CORS, logging y aliases `/v1` + `/api/v1`.
- `app/calculator.py`: motor legal de recargos y alertas.
- `app/db/models.py`: modelos SQLAlchemy.
- `app/api/routers/*`: auth, empresa, empleados, jornadas, reportes y auditoria.
- `app/services/*`: orquestacion de negocio, importaciones y serializacion.
- `alembic/`: migraciones versionadas.

## Modelos de datos

- `Company`
- `User`
- `Employee`
- `TimeEntry`
- `CalculationResult`
- `AuditEvent`

## Migraciones

```bash
python -m alembic -c backend/alembic.ini upgrade head
```

Migracion inicial:

- [20260406_000001_initial_schema.py](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/backend/alembic/versions/20260406_000001_initial_schema.py)

## Despliegue en Vercel

Despliega esta carpeta como un proyecto independiente:

1. Crea un proyecto nuevo en Vercel apuntando al mismo repositorio.
2. Configura `Root Directory = backend`.
3. El entrypoint FastAPI queda en [index.py](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/backend/index.py).
4. Configura `DATABASE_URL`, `JWT_SECRET_KEY`, `COOKIE_SECURE=true`, `COOKIE_SAMESITE=lax` y `CORS_ORIGINS` con el dominio del frontend.
5. Ejecuta las migraciones sobre la base productiva antes del primer uso.

## Seed basico

```bash
$env:PYTHONPATH="backend"
python -m app.scripts.seed
```

Variables relevantes:

- `SEED_COMPANY_NAME`
- `SEED_COMPANY_NIT`
- `SEED_ADMIN_NAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

## Endpoints

### Auth

`POST /v1/auth/login`

Request:

```json
{
  "email": "admin@empresa.com",
  "password": "Admin123!"
}
```

Response:

```json
{
  "access_token_expires_in": 900,
  "refresh_token_expires_in": 604800,
  "user": {
    "id": "uuid",
    "company_id": "uuid",
    "email": "admin@empresa.com",
    "full_name": "Administrador Tempo",
    "role": "admin",
    "is_active": true,
    "last_login_at": "2026-04-06T00:00:00Z"
  }
}
```

### Employees

`POST /v1/employees`

```json
{
  "external_code": "EMP-001",
  "full_name": "Laura Torres",
  "email": "laura.torres@empresa.com",
  "position": "Analista de nomina",
  "area": "Nomina",
  "age": 29,
  "base_salary": 2800000,
  "weekly_hours": 42,
  "work_days_per_week": 5,
  "status": "activo"
}
```

### Time entries

`POST /v1/time-entries`

```json
{
  "employee_id": "uuid-empleado",
  "work_date": "2026-04-06",
  "check_in": "08:00:00",
  "check_out": "17:00:00",
  "is_holiday": false,
  "is_sunday": false,
  "weekly_accumulated_hours": 0,
  "notes": "Turno base"
}
```

Response resumida:

```json
{
  "id": "uuid-jornada",
  "employee_name": "Laura Torres",
  "work_date": "2026-04-06",
  "calculation_result": {
    "valor_total_dia": 106060.61,
    "alerta_limite_legal": false
  }
}
```

### Importacion CSV/XLSX

`POST /v1/time-entries/import`

Form data:

- `file`
- `create_missing_employees`
- `mapping` opcional en JSON

Response:

```json
{
  "audit_event_id": "uuid",
  "total_rows": 120,
  "successful_rows": 118,
  "rejected_rows": 2,
  "successes": [],
  "errors": [
    {
      "row_number": 11,
      "reason": "Hora no valida: xx. Usa formatos como HH:MM."
    }
  ],
  "error_report_download_url": "/api/v1/time-entries/imports/uuid/errors.csv"
}
```

### Reportes

`GET /v1/reports?start_date=2026-04-01&end_date=2026-04-30&area=Nomina&legal_alert=false`

Response:

```json
{
  "summary": {
    "total_employees": 12,
    "total_time_entries": 44,
    "total_hours": 378,
    "total_value": 9540000,
    "legal_alerts": 2,
    "compliance_rate": 95.45
  },
  "rows": []
}
```

## Seguridad base

- JWT `access` + `refresh`
- Cookies `HttpOnly`
- Rate limiting in-memory por IP y ruta
- CORS configurable por entorno
- Logging estructurado JSON
- Validacion Pydantic y errores uniformes

## Nota legal

El motor legal mantiene la logica vigente para la referencia del 15 de julio de 2026:

- jornada maxima de 42 horas semanales,
- horario nocturno desde las 19:00,
- recargo por descanso obligatorio del 90%,
- proteccion reforzada para menores entre 15 y 17 anos.
