import { fetchJson } from "@/lib/fetch-json";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api").replace(/\/$/, "");

export type JornadaBreakdownItem = {
  etiqueta: string;
  horas: number;
  recargo_porcentual: number;
  factor_total: number;
  valor_base: number;
  valor_total: number;
};

export type JornadaRequest = {
  empleado: {
    edad: number;
    salario_base: number;
  };
  hora_entrada: string;
  hora_salida: string;
  es_festivo: boolean;
  es_dominical: boolean;
  acumulado_semanal_horas: number;
  configuracion: {
    dias_laborales_semana: 5 | 6;
    horas_semanales_pactadas?: number | null;
    horas_diarias_pactadas?: number | null;
    divisor_hora_mensual?: number | null;
    fecha_referencia_normativa: string;
    recargo_descanso_obligatorio?: number | null;
  };
};

export type JornadaResponse = {
  valor_total_dia: number;
  valor_hora_ordinaria: number;
  horas_totales_dia: number;
  desglose_horas: Record<string, JornadaBreakdownItem>;
  alerta_limite_legal: boolean;
  alertas: string[];
  reglas_aplicadas: Record<string, string | number | boolean | null>;
};

export async function calculateWorkday(
  payload: JornadaRequest,
): Promise<JornadaResponse> {
  return fetchJson<JornadaResponse>(`${apiBaseUrl}/v1/jornada/calcular`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
