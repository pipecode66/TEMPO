"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Calculator,
  FileSpreadsheet,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
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
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/fetch-json";
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

function downloadTextFile(filename: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function TimeControlModule() {
  const {
    addTimeEntry,
    downloadImportErrorsCsv,
    importEntries,
    lastImportResult,
    policySettings,
    removeTimeEntry,
    timeEntries,
  } = useTempoWorkspace();
  const { permissions } = useAuth();
  const { employees } = useTempoWorkspace();

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
  const [importFile, setImportFile] = useState<File | null>(null);
  const [mappingJson, setMappingJson] = useState("");
  const [createMissingEmployees, setCreateMissingEmployees] = useState(true);
  const [importMessage, setImportMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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

  function updateField(field: keyof typeof formState, value: string | boolean) {
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

      if (selectedEmployee && permissions.canManageTimeEntries) {
        await addTimeEntry({
          employeeId: selectedEmployee.id,
          fecha: formState.fecha,
          horaEntrada: formState.horaEntrada,
          horaSalida: formState.horaSalida,
          esFestivo: formState.esFestivo,
          esDominical: formState.esDominical,
          acumuladoSemanalHoras: payload.acumulado_semanal_horas,
          notes: "Registrado desde Tempo workspace",
        });
        setStatusMessage({
          type: "success",
          text: "Jornada calculada y registrada en la base central.",
        });
      } else if (selectedEmployee && !permissions.canManageTimeEntries) {
        setStatusMessage({
          type: "success",
          text: "Jornada calculada. Tu rol no tiene permiso para guardarla.",
        });
      } else {
        setStatusMessage({
          type: "success",
          text:
            "Jornada calculada en modo manual. Para persistirla debes seleccionar un empleado existente.",
        });
      }
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: getApiErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!permissions.canManageTimeEntries) {
      setImportMessage({
        type: "error",
        text: "Tu rol no puede cargar importaciones masivas.",
      });
      return;
    }
    if (!importFile) {
      setImportMessage({
        type: "error",
        text: "Selecciona un archivo CSV o XLSX antes de importar.",
      });
      return;
    }

    try {
      setIsImporting(true);
      const mapping =
        mappingJson.trim().length > 0
          ? (JSON.parse(mappingJson) as Record<string, string>)
          : undefined;
      const result = await importEntries(importFile, {
        createMissingEmployees,
        mapping,
      });
      setImportMessage({
        type: "success",
        text: `Importacion completada: ${result.successful_rows} filas exitosas y ${result.rejected_rows} rechazadas.`,
      });
    } catch (error) {
      setImportMessage({
        type: "error",
        text: getApiErrorMessage(error),
      });
    } finally {
      setIsImporting(false);
    }
  }

  async function handleDownloadImportErrors() {
    if (!lastImportResult?.error_report_download_url) {
      return;
    }

    try {
      const content = await downloadImportErrorsCsv(lastImportResult.error_report_download_url);
      downloadTextFile("tempo-import-errors.csv", content, "text/csv;charset=utf-8");
    } catch (error) {
      setImportMessage({
        type: "error",
        text: getApiErrorMessage(error),
      });
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
              Calcula el impacto legal y, si eliges un empleado, guarda la jornada con auditoria.
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
                      <SelectItem value="manual">Solo calculo manual</SelectItem>
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
                  disabled={Boolean(selectedEmployee)}
                />
                <Input
                  value={formState.manualArea}
                  onChange={(event) => updateField("manualArea", event.target.value)}
                  placeholder="Area o centro de costo"
                  disabled={Boolean(selectedEmployee)}
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

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <Calculator className="h-4 w-4" />
                  {isSubmitting
                    ? "Procesando..."
                    : selectedEmployee && permissions.canManageTimeEntries
                      ? "Calcular y guardar jornada"
                      : "Calcular jornada"}
                </Button>
                {!permissions.canManageTimeEntries ? (
                  <Badge variant="outline" className="justify-center px-4">
                    Rol en consulta
                  </Badge>
                ) : null}
              </div>
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
              <CardTitle>Importacion masiva</CardTitle>
              <CardDescription>
                Migra jornadas desde CSV o Excel con validacion por fila y reporte de errores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleImport} className="space-y-4">
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xlsm"
                  onChange={(event) => {
                    setImportFile(event.target.files?.[0] ?? null);
                  }}
                  disabled={!permissions.canManageTimeEntries}
                />
                <Textarea
                  value={mappingJson}
                  onChange={(event) => setMappingJson(event.target.value)}
                  placeholder='Mapeo opcional JSON, por ejemplo: {"employee_name":"Empleado","work_date":"Fecha"}'
                  disabled={!permissions.canManageTimeEntries}
                />
                <label className="flex items-center gap-3 text-sm text-foreground">
                  <Checkbox
                    checked={createMissingEmployees}
                    onCheckedChange={(checked) => setCreateMissingEmployees(checked === true)}
                    disabled={!permissions.canManageTimeEntries}
                  />
                  Crear empleados faltantes durante la importacion
                </label>

                {importMessage ? (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      importMessage.type === "success"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {importMessage.text}
                  </div>
                ) : null}

                {lastImportResult ? (
                  <div className="rounded-2xl bg-background/60 p-4 text-sm text-muted-foreground">
                    <p>
                      Ultima importacion: {lastImportResult.successful_rows} exitosas y{" "}
                      {lastImportResult.rejected_rows} rechazadas.
                    </p>
                    {lastImportResult.error_report_download_url ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-3"
                        onClick={() => void handleDownloadImportErrors()}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Descargar errores CSV
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!permissions.canManageTimeEntries || isImporting}
                >
                  <Upload className="h-4 w-4" />
                  {isImporting ? "Importando..." : "Importar archivo"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Historial reciente</CardTitle>
              <CardDescription>
                Ultimas jornadas persistidas en la base central del workspace.
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
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          entry.response.alerta_limite_legal ? "destructive" : "secondary"
                        }
                      >
                        {entry.response.alerta_limite_legal ? "Alerta" : "OK"}
                      </Badge>
                      {permissions.canManageTimeEntries ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void removeTimeEntry(entry.id)}
                          aria-label={`Eliminar jornada de ${entry.employeeName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
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
