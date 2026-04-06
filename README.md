# Tempo

Software de control de tiempos para Colombia con frontend en Next.js y motor legal en FastAPI.

## Despliegue en Vercel

Este repositorio incluye configuracion para evitar errores comunes donde el frontend espera JSON pero recibe HTML, un cuerpo vacio o una ruta mal resuelta.

### Archivos clave

- `vercel.json`: configura las funciones Python y evita cache accidental en `/api/*`.
- `api/index.py`: expone la aplicacion FastAPI como Vercel Function.
- `api/requirements.txt`: dependencias de runtime para la funcion Python.
- `.env.example`: base URL sugerida para consumir la API desde el frontend.
- `lib/fetch-json.ts`: utilidad defensiva para no ejecutar `response.json()` sobre respuestas vacias o no JSON.

### Endpoints

- En Vercel: `POST /api/v1/jornada/calcular`
- Local con Uvicorn: `POST /v1/jornada/calcular`

La API tambien expone:

- En Vercel: `GET /api/health`
- Local con Uvicorn: `GET /health`

## Variables de entorno

```bash
NEXT_PUBLIC_API_BASE_URL=/api
```

## Verificacion local del frontend

```bash
npm install
npx tsc --noEmit
npm run build
```

## Verificacion local del backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload
```
