# Tempo

Software de control de tiempos y horas extra para Colombia, pensado para reemplazar gestion operativa en Excel con una plataforma multiusuario, auditable y lista para integracion con nomina.

## Arquitectura final

- Frontend: Next.js App Router + React 19 + TypeScript + Tailwind/shadcn.
- Backend: FastAPI + Pydantic + SQLAlchemy.
- Persistencia: PostgreSQL en produccion, SQLite para desarrollo y pruebas.
- Migraciones: Alembic.
- Auth: JWT con cookies seguras `HttpOnly` para `access` y `refresh`.
- Seguridad base: CORS, rate limiting in-memory, validacion estricta y logging estructurado.
- Despliegue: Next.js + funciones Python en Vercel bajo `/api`.

## Capacidades implementadas

- Login real contra backend con roles `admin`, `nomina`, `supervisor` y `consulta`.
- Rutas y acciones protegidas por rol en frontend y backend.
- CRUD centralizado para empresa, empleados y jornadas.
- Importacion masiva desde CSV/XLSX con validacion por fila, resumen y descarga de errores.
- Reportes server-side con filtros por fecha, empleado, area y alerta legal.
- Exportacion de reportes en CSV/JSON desde backend.
- Auditoria de login/logout, cambios maestros, jornadas e importaciones.
- Motor legal de calculo preservado y reutilizado por la capa transaccional.

## Variables de entorno

Usa `.env.example` como base.

```bash
NEXT_PUBLIC_API_BASE_URL=/api
TEMPO_BACKEND_PROXY_URL=http://127.0.0.1:8000
DATABASE_URL=postgresql+psycopg://tempo:tempo@localhost:5432/tempo
JWT_SECRET_KEY=change-this-secret-in-production
```

Notas:

- `NEXT_PUBLIC_API_BASE_URL=/api` mantiene auth por cookies en el mismo origen.
- `TEMPO_BACKEND_PROXY_URL` solo se usa en desarrollo para que `next dev` haga proxy al backend local.
- En produccion, Vercel sirve el frontend y el backend desde el mismo dominio.

## Desarrollo local

### Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
python -m alembic -c backend/alembic.ini upgrade head
$env:PYTHONPATH="backend"
python -m app.scripts.seed
uvicorn app.main:app --reload --app-dir backend
```

### Frontend

```bash
npm install
npm run dev
```

Con `TEMPO_BACKEND_PROXY_URL=http://127.0.0.1:8000`, el frontend consumira el backend local desde `/api/*`.

## Endpoints principales

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET|PUT /api/v1/company`
- `GET|POST|PATCH|DELETE /api/v1/employees`
- `GET|POST|PATCH|DELETE /api/v1/time-entries`
- `POST /api/v1/time-entries/import`
- `GET /api/v1/time-entries/imports/{audit_event_id}/errors.csv`
- `GET /api/v1/reports`
- `GET /api/v1/reports/export.csv`
- `GET /api/v1/reports/export.json`
- `GET /api/v1/audit-events`
- `POST /api/v1/jornada/calcular`

Mas detalle y ejemplos en [backend/README.md](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/backend/README.md).

## Despliegue en Vercel

Archivos clave:

- [vercel.json](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/vercel.json)
- [api/index.py](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/api/index.py)
- [api/[...path].py](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/api/[...path].py)
- [api/requirements.txt](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/api/requirements.txt)
- [next.config.mjs](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/next.config.mjs)

Flujo:

1. Configura `DATABASE_URL`, `JWT_SECRET_KEY`, `COOKIE_SECURE=true` y `CORS_ORIGINS`.
2. Ejecuta migraciones contra la base objetivo.
3. Despliega a Vercel.
4. El frontend consumira la API por `/api/v1/*` en el mismo dominio.

## Validacion ejecutada

```bash
npx tsc --noEmit
npm run lint
npm run build
python -m pytest backend/tests -q
npm audit --omit=dev
```
