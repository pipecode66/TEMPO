"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { AlertTriangle, Calculator, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiResponseError } from "@/lib/fetch-json";
import {
  calculateWorkday,
  type JornadaRequest,
  type JornadaResponse,
} from "@/lib/tempo-api";
import { formatCurrency, formatHours, getTodayIsoDate } from "@/lib/tempo-format";
import { useTempoWorkspace } from "@/components/workspace/tempo-provider";

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveApiError(error: unknown): string {
  if (error instanceof ApiResponseError) {
    if (typeof error.payload === "string" && error.payload.length > 0) {
      return error.payload;
    }

    if (
      typeof error.payload === "object" &&
      error.payload &&
      "detail" in error.payload &&
      typeof error.payload.detail === "string"
    ) {
      return error.payload.detail;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible calcular la jornada en este momento.";
}

export function TimeControlModule() {
  const { employees, policySettings, addTimeEntry, timeEntries } = useTempoWorkspace();
  const [formState, setFormState] = useState({
    selectedEmployeeId: "manual",
    manualName: "",
    manualArea: "",
    edad: "",
    salarioBase: "",
    fecha: getTodayIsoDate(),
    horaEntrada: "08:00",
    horaSalida: "17:00",
    esFestivo: false,
    esDominical: false,
    acumuladoSemanalHoras: "0",
    diasLaboralesSemana: String(policySettings.diasLaboralesSemana),
    horasSemanalesPactadas: String(policySettings.jornadaSemanalMaxima),
    horasDiariasPactadas: "",
    divisorHoraMensual: "",
    fechaNormativa: policySettings.fechaNormativa,
    recargoDescansoObligatorio: String(policySettings.recargoDescansoObligatorio),
  });
  const [result, setResult] = useState<JornadaResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedEmployee = employees.find(
    (employee) => employee.id === formState.selectedEmployeeId,
  );

  useEffect(() => {
    if (!selectedEmployee) {
      return;
    }

    setFormState((current) => ({
      ...current,
      manualName: selectedEmployee.nombre,
      manualArea: selectedEmployee.area,
      edad: String(selectedEmployee.edad),
      salarioBase: String(selectedEmployee.salarioBase),
      diasLaboralesSemana: String(selectedEmployee.diasLaboralesSemana),
      horasSemanalesPactadas: String(selectedEmployee.jornadaSemanalHoras),
    }));
  }, [selectedEmployee]);

  function updateField(
    field: keyof typeof formState,
    value: string | boolean,
  ) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);

    const edad = Number(formState.edad);
    const salarioBase = Number(formState.salarioBase);
    const acumuladoSemanalHoras = Number(formState.acumuladoSemanalHoras || "0");

    if (!selectedEmployee && !formState.manualName.trim()) {
      setStatusMessage({
        type: "error",
        text: "Si trabajas en modo manual debes indicar el nombre del empleado.",
      });
      return;
    }

    if (!Number.isFinite(edad) || edad < 15) {
      setStatusMessage({
        type: "error",
        text: "La edad debe ser valida y cumplir el minimo legal de 15 anos.",
      });
      return;
    }

    if (!Number.isFinite(salarioBase) || salarioBase <= 0) {
      setStatusMessage({
        type: "error",
        text: "Ingresa un salario base valido para poder liquidar la jornada.",
      });
      return;
    }

    const payload: JornadaRequest = {
      empleado: {
        edad,
        salario_base: salarioBase,
      },
      hora_entrada: formState.horaEntrada,
      hora_salida: formState.horaSalida,
      es_festivo: formState.esFestivo,
      es_dominical: formState.esDominical,
      acumulado_semanal_horas: Number.isFinite(acumuladoSemanalHoras)
        ? acumuladoSemanalHoras
        : 0,
      configuracion: {
        dias_laborales_semana: Number(formState.diasLaboralesSemana) as 5 | 6,
        horas_semanales_pactadas: parseOptionalNumber(formState.horasSemanalesPactadas),
        horas_diarias_pactadas: parseOptionalNumber(formState.horasDiariasPactadas),
        divisor_hora_mensual: parseOptionalNumber(formState.divisorHoraMensual),
        fecha_referencia_normativa: formState.fechaNormativa,
        recargo_descanso_obligatorio: parseOptionalNumber(
          formState.recargoDescansoObligatorio,
        ),
      },
    };

    try {
      setIsSubmitting(true);
      const response = await calculateWorkday(payload);
      setResult(response);
      setStatusMessage({
        type: "success",
        text: "Jornada calculada y guardada en el historial operativo.",
      });

      addTimeEntry({
        fecha: formState.fecha,
        employeeId: selectedEmployee?.id,
        employeeName: selectedEmployee?.nombre || formState.manualName.trim(),
        area: selectedEmployee?.area || formState.manualArea.trim() || "Sin area",
        horaEntrada: formState.horaEntrada,
        horaSalida: formState.horaSalida,
        esFestivo: formState.esFestivo,
        esDominical: formState.esDominical,
        acumuladoSemanalHoras: payload.acumulado_semanal_horas,
        response,
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: resolveApiError(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCheckbox(field: "esFestivo" | "esDominical", checked: boolean) {
    updateField(field, checked);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Liquidar jornada</CardTitle>
            <CardDescription>
              Usa un empleado existente o trabaja en modo manual para calcular recargos y horas extra.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Empleado</p>
                  <Select
                    value={formState.selectedEmployeeId}
                    onValueChange={(value) => updateField("selectedEmployeeId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Calculo manual</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Fecha del turno</p>
                  <Input
                    type="date"
                    value={formState.fecha}
                    onChange={(event) => updateField("fecha", event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  value={formState.manualName}
                  onChange={(event) => updateField("manualName", event.target.value)}
                  placeholder="Nombre del empleado"
                />
                <Input
                  value={formState.manualArea}
                  onChange={(event) => updateField("manualArea", event.target.value)}
                  placeholder="Area o centro de costo"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  type="number"
                  min="15"
                  value={formState.edad}
                  onChange={(event) => updateField("edad", event.target.value)}
                  placeholder="Edad"
                />
                <Input
                  type="number"
                  min="1"
                  value={formState.salarioBase}
                  onChange={(event) => updateField("salarioBase", event.target.value)}
                  placeholder="Salario base"
                />
                <Input
                  type="time"
                  value={formState.horaEntrada}
                  onChange={(event) => updateField("horaEntrada", event.target.value)}
                />
                <Input
                  type="time"
                  value={formState.horaSalida}
                  onChange={(event) => updateField("horaSalida", event.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  type="number"
                  min="0"
                  value={formState.acumuladoSemanalHoras}
                  onChange={(event) =>
                    updateField("acumuladoSemanalHoras", event.target.value)
                  }
                  placeholder="Acumulado semanal"
                />
                <Select
                  value={formState.diasLaboralesSemana}
                  onValueChange={(value) => updateField("diasLaboralesSemana", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 dias</SelectItem>
                    <SelectItem value="6">6 dias</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  value={formState.horasSemanalesPactadas}
                  onChange={(event) =>
                    updateField("horasSemanalesPactadas", event.target.value)
                  }
                  placeholder="Horas semanales"
                />
                <Input
                  type="number"
                  min="1"
                  value={formState.horasDiariasPactadas}
                  onChange={(event) =>
                    updateField("horasDiariasPactadas", event.target.value)
                  }
                  placeholder="Horas diarias"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  type="number"
                  min="1"
                  value={formState.divisorHoraMensual}
                  onChange={(event) => updateField("divisorHoraMensual", event.target.value)}
                  placeholder="Divisor hora mensual"
                />
                <Input
                  type="date"
                  value={formState.fechaNormativa}
                  onChange={(event) => updateField("fechaNormativa", event.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={formState.recargoDescansoObligatorio}
                  onChange={(event) =>
                    updateField("recargoDescansoObligatorio", event.target.value)
                  }
                  placeholder="Recargo descanso"
                />
              </div>

              <div className="grid gap-4 rounded-2xl bg-background/60 p-4 sm:grid-cols-2">
                <label className="flex items-center gap-3 text-sm text-foreground">
                  <Checkbox
                    checked={formState.esFestivo}
                    onCheckedChange={(checked) =>
                      handleCheckbox("esFestivo", checked === true)
                    }
                  />
                  Es festivo
                </label>
                <label className="flex items-center gap-3 text-sm text-foreground">
                  <Checkbox
                    checked={formState.esDominical}
                    onCheckedChange={(checked) =>
                      handleCheckbox("esDominical", checked === true)
                    }
                  />
                  Es dominical
                </label>
              </div>

              {statusMessage ? (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    statusMessage.type === "success"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {statusMessage.text}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <Calculator className="h-4 w-4" />
                {isSubmitting ? "Calculando..." : "Calcular jornada"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Resultado del calculo</CardTitle>
              <CardDescription>
                Tempo devuelve el valor del dia, desglose por categoria y alertas legales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="rounded-3xl border border-dashed border-border bg-background/50 px-6 py-10 text-center">
                  <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-4 text-base font-medium text-foreground">
                    Aun no hay un calculo activo
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Completa el formulario y envia la jornada para ver el detalle legal aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-background/60 p-4">
                      <p className="text-sm text-muted-foreground">Valor total del dia</p>
                      <p className="mt-2 text-3xl font-display text-foreground">
                        {formatCurrency(result.valor_total_dia)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-background/60 p-4">
                      <p className="text-sm text-muted-foreground">Valor hora ordinaria</p>
                      <p className="mt-2 text-3xl font-display text-foreground">
                        {formatCurrency(result.valor_hora_ordinaria)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-background/60 p-4">
                      <p className="text-sm text-muted-foreground">Horas del turno</p>
                      <p className="mt-2 text-3xl font-display text-foreground">
                        {formatHours(result.horas_totales_dia)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-background/60 p-4">
                      <p className="text-sm text-muted-foreground">Estado legal</p>
                      <div className="mt-2">
                        <Badge
                          variant={
                            result.alerta_limite_legal ? "destructive" : "secondary"
                          }
                        >
                          {result.alerta_limite_legal ? "Con alerta" : "Sin alerta"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {result.alertas.length > 0 ? (
                    <div className="rounded-2xl bg-red-500/10 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        Alertas del turno
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-red-300">
                        {result.alertas.map((alert) => (
                          <li key={alert}>{alert}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-green-500/10 p-4 text-sm text-green-300">
                      La jornada cumple con los topes legales segun los datos enviados.
                    </div>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Horas</TableHead>
                        <TableHead>Factor</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(result.desglose_horas).map(([key, item]) => (
                        <TableRow key={key}>
                          <TableCell>{item.etiqueta}</TableCell>
                          <TableCell>{formatHours(item.horas)}</TableCell>
                          <TableCell>{item.factor_total.toFixed(2)}x</TableCell>
                          <TableCell>{formatCurrency(item.valor_total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Historial reciente</CardTitle>
              <CardDescription>
                Ultimas jornadas almacenadas localmente dentro del workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {timeEntries.length === 0 ? (
                <div className="rounded-2xl bg-background/60 px-4 py-4 text-sm text-muted-foreground">
                  Todavia no hay jornadas guardadas.
                </div>
              ) : (
                timeEntries.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-background/50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{entry.employeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.fecha} | {entry.horaEntrada} - {entry.horaSalida}
                      </p>
                    </div>
                    <Badge
                      variant={
                        entry.response.alerta_limite_legal ? "destructive" : "secondary"
                      }
                    >
                      {entry.response.alerta_limite_legal ? "Alerta" : "OK"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
