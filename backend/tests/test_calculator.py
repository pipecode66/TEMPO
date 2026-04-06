from datetime import date

from app.calculator import calcular_jornada_diaria
from app.models import CalculoJornadaRequest, ConfiguracionJornada, Empleado


def test_regular_day_generates_ordinary_hours():
    payload = CalculoJornadaRequest(
        empleado=Empleado(edad=30, salario_base=3000000),
        hora_entrada="08:00",
        hora_salida="16:00",
        acumulado_semanal_horas=0,
        configuracion=ConfiguracionJornada(
            dias_laborales_semana=5,
            horas_diarias_pactadas=8,
            fecha_referencia_normativa=date(2026, 7, 15),
        ),
    )

    result = calcular_jornada_diaria(payload)

    assert result.alerta_limite_legal is False
    assert result.desglose_horas["ordinarias_diurnas"].horas == 8


def test_night_surcharge_uses_19_00_window_in_july_2026():
    payload = CalculoJornadaRequest(
        empleado=Empleado(edad=29, salario_base=3000000),
        hora_entrada="18:00",
        hora_salida="22:00",
        acumulado_semanal_horas=0,
        configuracion=ConfiguracionJornada(
            dias_laborales_semana=5,
            horas_diarias_pactadas=8,
            fecha_referencia_normativa=date(2026, 7, 15),
        ),
    )

    result = calcular_jornada_diaria(payload)

    assert result.desglose_horas["ordinarias_diurnas"].horas == 1
    assert result.desglose_horas["recargo_nocturno"].horas == 3


def test_rest_day_surcharge_is_90_percent_on_july_15_2026():
    payload = CalculoJornadaRequest(
        empleado=Empleado(edad=32, salario_base=3000000),
        hora_entrada="08:00",
        hora_salida="12:00",
        es_festivo=True,
        acumulado_semanal_horas=0,
        configuracion=ConfiguracionJornada(
            dias_laborales_semana=5,
            horas_diarias_pactadas=8,
            fecha_referencia_normativa=date(2026, 7, 15),
        ),
    )

    result = calcular_jornada_diaria(payload)

    assert result.desglose_horas["dominical_festivo_diurno"].factor_total == 1.9


def test_minor_shift_after_18_generates_legal_alert():
    payload = CalculoJornadaRequest(
        empleado=Empleado(edad=16, salario_base=1800000),
        hora_entrada="13:00",
        hora_salida="19:00",
        acumulado_semanal_horas=20,
        configuracion=ConfiguracionJornada(
            dias_laborales_semana=5,
            fecha_referencia_normativa=date(2026, 7, 15),
        ),
    )

    result = calcular_jornada_diaria(payload)

    assert result.alerta_limite_legal is True
    assert any("18:00" in alert for alert in result.alertas)
