# Tempo

Software de control de tiempos y horas extra para Colombia, pensado para reemplazar gestion operativa en Excel con una plataforma multiusuario, auditable y lista para integracion con nomina.

## Arquitectura final

- Frontend: Next.js App Router + React 19 + TypeScript + Tailwind/shadcn.
- Backend: FastAPI + Pydantic + SQLAlchemy.
- Persistencia: PostgreSQL en produccion, SQLite para desarrollo y pruebas.
- Migraciones: Alembic.
- Auth: JWT con cookies seguras `HttpOnly` para `access` y `refresh`.
- Seguridad base: CORS, rate limiting in-memory, validacion estricta y logging estructurado.
- Despliegue soportado en Vercel: frontend Next.js en un proyecto y backend FastAPI en otro, unidos por un proxy server-side en `/api/*`.

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
TEMPO_BACKEND_ORIGIN=http://127.0.0.1:8000
DATABASE_URL=postgresql+psycopg://tempo:tempo@localhost:5432/tempo
JWT_SECRET_KEY=change-this-secret-in-production
```

Notas:

- `NEXT_PUBLIC_API_BASE_URL=/api` mantiene auth por cookies en el mismo origen.
- `TEMPO_BACKEND_ORIGIN` es la URL base real del backend FastAPI. El frontend la consume a traves de [app/api/[...path]/route.ts](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/app/api/[...path]/route.ts), manteniendo `/api/*` en el mismo dominio para cookies y auth.
- En local, apunta a `http://127.0.0.1:8000`.
- En produccion, puede apuntar al dominio del proyecto backend desplegado por separado, por ejemplo `https://tempoapibackend.vercel.app`. El proxy reintentara automaticamente con `/api` si ese backend esta montado bajo ese prefijo.

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

Con `TEMPO_BACKEND_ORIGIN=http://127.0.0.1:8000`, el frontend consumira el backend local desde `/api/*`.

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

Archivos clave del frontend:

- [vercel.json](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/vercel.json)
- [app/api/[...path]/route.ts](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/app/api/[...path]/route.ts)
- [next.config.mjs](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/next.config.mjs)

Archivos clave del backend:

- [backend/index.py](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/backend/index.py)
- [backend/vercel.json](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/backend/vercel.json)
- [backend/requirements.txt](/C:/Users/juanitou/Documents/TRABAJO/TEMPO/backend/requirements.txt)

Flujo soportado:

1. Despliega el backend como un proyecto Vercel separado con `Root Directory = backend`.
2. En el backend configura `DATABASE_URL`, `JWT_SECRET_KEY`, `COOKIE_SECURE=true` y `CORS_ORIGINS` incluyendo el dominio del frontend.
3. Despliega el frontend en el proyecto principal.
4. En el frontend configura `TEMPO_BACKEND_ORIGIN=https://tu-backend.example.com`.
5. El frontend seguira consumiendo `/api/v1/*` en el mismo dominio, pero el proxy Next reenviara la solicitud al backend real.

Nota:

- Segun la documentacion oficial de Vercel, mezclar Next.js y FastAPI dentro del mismo proyecto bajo un solo dominio requiere `Services`, una capacidad en beta privada. Por eso el despliegue anterior devolvia `404` para `/api/v1/*`.

## Validacion ejecutada

```bash
npx tsc --noEmit
npm run lint
npm run build
python -m pytest backend/tests -q
npm audit --omit=dev
```
