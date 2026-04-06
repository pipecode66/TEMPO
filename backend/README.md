# Tempo API

Backend en Python con FastAPI para el calculo de jornadas, recargos y alertas legales en Colombia.

## Alcance

- Jornada maxima semanal con aplicacion gradual de la Ley 2101.
- Actualizacion normativa para julio de 2026:
  - 42 horas semanales desde el 15 de julio de 2026.
  - Trabajo nocturno entre las 19:00 y las 06:00 desde el 25 de diciembre de 2025.
  - Recargo por descanso obligatorio del 90% desde el 1 de julio de 2026.
- Proteccion reforzada para adolescentes de 15 a 17 anos.
- Soporte para turnos que cruzan medianoche.

## Ejecutar

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --app-dir backend
```

## Endpoint principal

`POST /v1/jornada/calcular` en local con Uvicorn.

`POST /api/v1/jornada/calcular` cuando se despliega en Vercel usando `api/index.py`.

Ejemplo de payload:

```json
{
  "empleado": {
    "edad": 29,
    "salario_base": 3200000
  },
  "hora_entrada": "18:00",
  "hora_salida": "23:30",
  "es_festivo": true,
  "es_dominical": false,
  "acumulado_semanal_horas": 39,
  "configuracion": {
    "dias_laborales_semana": 5,
    "horas_diarias_pactadas": 8,
    "fecha_referencia_normativa": "2026-07-15"
  }
}
```

## Nota legal

El prompt original del proyecto usaba valores historicos de recargo nocturno desde las 21:00 y descanso obligatorio al 75%. Para una fecha de referencia del 15 de julio de 2026, Tempo aplica por defecto las reglas vigentes verificadas: nocturno desde las 19:00 y descanso obligatorio del 90%, con opcion de parametrizar el divisor horario o un recargo superior si la empresa se acoge anticipadamente al 100%.
