from __future__ import annotations

from datetime import date, time
from typing import Any, Literal

from pydantic import BaseModel, Field, NonNegativeFloat, PositiveFloat, model_validator


class Empleado(BaseModel):
    edad: int = Field(..., ge=15, le=99, description="Edad del empleado.")
    salario_base: PositiveFloat = Field(
        ..., description="Salario base mensual en COP."
    )

    @property
    def es_menor_protegido(self) -> bool:
        return 15 <= self.edad <= 17


class ConfiguracionJornada(BaseModel):
    dias_laborales_semana: Literal[5, 6] = Field(
        default=5, description="Distribucion pactada en 5 o 6 dias."
    )
    horas_semanales_pactadas: PositiveFloat | None = Field(
        default=None,
        description="Tope ordinario semanal pactado. Si no se envia, se usa el tope legal de la fecha de referencia.",
    )
    horas_diarias_pactadas: PositiveFloat | None = Field(
        default=None,
        description="Tope ordinario diario pactado. Si no se envia, se deriva del tope semanal y los dias laborables.",
    )
    divisor_hora_mensual: PositiveFloat | None = Field(
        default=None,
        description="Divisor opcional para obtener el valor de la hora ordinaria.",
    )
    fecha_referencia_normativa: date = Field(
        default=date(2026, 7, 15),
        description="Fecha con la que se determinan topes y recargos legales.",
    )
    recargo_descanso_obligatorio: NonNegativeFloat | None = Field(
        default=None,
        le=1.0,
        description="Sobrescribe el recargo legal de dominical/festivo si la empresa paga un porcentaje superior.",
    )


class CalculoJornadaRequest(BaseModel):
    empleado: Empleado
    hora_entrada: time = Field(..., examples=["08:00"])
    hora_salida: time = Field(..., examples=["17:30"])
    es_festivo: bool = False
    es_dominical: bool = False
    acumulado_semanal_horas: NonNegativeFloat = Field(
        default=0,
        description="Horas acumuladas antes del turno que se esta liquidando.",
    )
    configuracion: ConfiguracionJornada = Field(
        default_factory=ConfiguracionJornada
    )

    @property
    def es_descanso_obligatorio(self) -> bool:
        return self.es_festivo or self.es_dominical

    @model_validator(mode="after")
    def validate_times(self) -> "CalculoJornadaRequest":
        if self.hora_entrada == self.hora_salida:
            raise ValueError("La hora de entrada y salida no pueden ser iguales.")

        if any(
            value.second or value.microsecond
            for value in (self.hora_entrada, self.hora_salida)
        ):
            raise ValueError(
                "Tempo procesa turnos con precision de minutos. Envie horas sin segundos."
            )

        return self


class DesgloseItem(BaseModel):
    etiqueta: str
    horas: float
    recargo_porcentual: float
    factor_total: float
    valor_base: float
    valor_total: float


class CalculoJornadaResponse(BaseModel):
    valor_total_dia: float
    valor_hora_ordinaria: float
    horas_totales_dia: float
    desglose_horas: dict[str, DesgloseItem]
    alerta_limite_legal: bool
    alertas: list[str]
    reglas_aplicadas: dict[str, Any]
