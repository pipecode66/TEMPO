"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Link2,
  Send,
  ShieldAlert,
  TrendingUp,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApiErrorMessage } from "@/lib/fetch-json";
import {
  dispatchPayrollConnector,
  getCostProjection,
  listPayrollConnectors,
  type CostProjectionResponse,
  type PayrollConnectorResponse,
  upsertPayrollConnector,
} from "@/lib/tempo-api";
import { formatCurrency, formatHours, formatShortDateTime } from "@/lib/tempo-format";
import { useTempoWorkspace } from "@/components/workspace/tempo-provider";

function downloadFile(filename: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

function downloadExcel(
  filename: string,
  rows: Array<Record<string, string | number | boolean>>,
) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
  XLSX.writeFile(workbook, filename);
}

function getInitialMonthLabel() {
  return new Date().toISOString().slice(0, 7);
}

const emptyProjection: CostProjectionResponse = {
  month_label: "",
  actual_extra_cost: 0,
  pending_extra_cost: 0,
  projected_month_end_extra_cost: 0,
  approved_hours: 0,
  pending_hours: 0,
};

export function ReportsModule() {
  const { permissions } = useAuth();
  const {
    auditEvents,
    employees,
    exportReport,
    fetchReports,
    isSyncing,
    refreshAudit,
    report,
    timeEntries,
  } = useTempoWorkspace();
  const [feedback, setFeedback] = useState("");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    employeeId: "all",
    area: "all",
    legalAlert: "all",
  });
  const [selectedMonth, setSelectedMonth] = useState(getInitialMonthLabel());
  const [isExporting, setIsExporting] = useState(false);
  const [projection, setProjection] = useState<CostProjectionResponse>(emptyProjection);
  const [connectors, setConnectors] = useState<PayrollConnectorResponse[]>([]);
  const [connectorForm, setConnectorForm] = useState({
    name: "",
    provider: "",
    endpointUrl: "",
    authToken: "",
  });
  const [isSavingConnector, setIsSavingConnector] = useState(false);
  const [dispatchingConnectorId, setDispatchingConnectorId] = useState<string | null>(null);

  const reportRows = report?.rows ?? [];
  const summary = report?.summary ?? {
    total_employees: employees.length,
    total_time_entries: 0,
    total_hours: 0,
    total_value: 0,
    legal_alerts: 0,
    compliance_rate: 100,
  };

  const areas = useMemo(() => {
    return Array.from(new Set(timeEntries.map((entry) => entry.area))).sort();
  }, [timeEntries]);

  const alertRows = reportRows.filter((row) => row.legal_alert);

  async function refreshOperationalPanels(month = selectedMonth) {
    try {
      const [nextProjection, nextConnectors] = await Promise.all([
        getCostProjection(month),
        listPayrollConnectors(),
      ]);
      setProjection(nextProjection);
      setConnectors(nextConnectors);
    } catch (error) {
      setFeedback(getApiErrorMessage(error));
    }
  }

  useEffect(() => {
    void refreshOperationalPanels(selectedMonth);
  }, []);

  async function applyFilters() {
    setFeedback("");
    try {
      await fetchReports({
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        employee_id: filters.employeeId === "all" ? undefined : filters.employeeId,
        area: filters.area === "all" ? undefined : filters.area,
        legal_alert:
          filters.legalAlert === "all"
            ? undefined
            : filters.legalAlert === "true",
      });
      const nextMonth = (filters.startDate || selectedMonth).slice(0, 7) || selectedMonth;
      setSelectedMonth(nextMonth);
      await refreshOperationalPanels(nextMonth);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "No fue posible cargar el reporte.",
      );
    }
  }

  async function handleExport(format: "csv" | "json" | "xlsx") {
    try {
      setIsExporting(true);
      if (format === "xlsx") {
        downloadExcel(
          `tempo-report-${selectedMonth}.xlsx`,
          reportRows.map((row) => ({
            empleado: row.employee_name,
            area: row.area,
            fecha: row.work_date,
            entrada: row.check_in,
            salida: row.check_out,
            horas: row.total_hours,
            valor_total: row.total_value,
            alerta_legal: row.legal_alert,
          })),
        );
        setFeedback("Reporte exportado en Excel.");
        return;
      }

      const content = await exportReport(format, {
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        employee_id: filters.employeeId === "all" ? undefined : filters.employeeId,
        area: filters.area === "all" ? undefined : filters.area,
        legal_alert:
          filters.legalAlert === "all"
            ? undefined
            : filters.legalAlert === "true",
      });
      if (format === "csv") {
        downloadFile("tempo-report.csv", content, "text/csv;charset=utf-8");
      } else {
        downloadFile("tempo-report.json", content, "application/json");
      }
      setFeedback(`Reporte exportado en ${format.toUpperCase()}.`);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "No fue posible exportar el reporte.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function handleSaveConnector() {
    if (!permissions.canManageSettings) {
      setFeedback("Solo administracion o nomina pueden configurar conectores.");
      return;
    }

    try {
      setIsSavingConnector(true);
      setFeedback("");
      await upsertPayrollConnector({
        name: connectorForm.name,
        provider: connectorForm.provider,
        endpoint_url: connectorForm.endpointUrl,
        auth_token: connectorForm.authToken || null,
        payload_format: "json",
        is_active: true,
      });
      setConnectorForm({
        name: "",
        provider: "",
        endpointUrl: "",
        authToken: "",
      });
      await refreshOperationalPanels(selectedMonth);
      setFeedback("Conector guardado correctamente.");
    } catch (error) {
      setFeedback(getApiErrorMessage(error));
    } finally {
      setIsSavingConnector(false);
    }
  }

  async function handleDispatchConnector(connectorId: string) {
    try {
      setDispatchingConnectorId(connectorId);
      const response = await dispatchPayrollConnector(connectorId, selectedMonth);
      setFeedback(response.detail);
      await refreshOperationalPanels(selectedMonth);
    } catch (error) {
      setFeedback(getApiErrorMessage(error));
    } finally {
      setDispatchingConnectorId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Cumplimiento</CardDescription>
            <CardTitle className="text-3xl font-display">
              {summary.compliance_rate}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Horas liquidadas</CardDescription>
            <CardTitle className="text-3xl font-display">
              {formatHours(summary.total_hours)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Valor acumulado</CardDescription>
            <CardTitle className="text-3xl font-display">
              {formatCurrency(summary.total_value)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Proyección mensual</CardDescription>
            <CardTitle className="text-3xl font-display">
              {formatCurrency(projection.projected_month_end_extra_cost)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Filtros operativos</CardTitle>
          <CardDescription>
            Consulta reportes por fechas, empleado, área y alertas legales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                setFilters((current) => ({ ...current, startDate: event.target.value }))
              }
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                setFilters((current) => ({ ...current, endDate: event.target.value }))
              }
            />
            <Select
              value={filters.employeeId}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, employeeId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Empleado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los empleados</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.area}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, area: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las áreas</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.legalAlert}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, legalAlert: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Alertas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="true">Solo con alerta</SelectItem>
                <SelectItem value="false">Solo sin alerta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => void applyFilters()} disabled={isSyncing}>
              Aplicar filtros
            </Button>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="sm:max-w-52"
            />
            <Button
              variant="outline"
              onClick={() => void refreshOperationalPanels(selectedMonth)}
            >
              Actualizar proyección
            </Button>
            <Button
              variant="outline"
              onClick={() => void refreshAudit()}
              disabled={!permissions.canViewAudit}
            >
              Refrescar auditoría
            </Button>
          </div>

          {feedback ? (
            <div className="rounded-2xl bg-background/60 px-4 py-3 text-sm text-muted-foreground">
              {feedback}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="cumplimiento">Cumplimiento</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
          <TabsTrigger value="exportacion">Exportación e integración</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Detalle consolidado</CardTitle>
              <CardDescription>
                Corte preparado para operación, nómina y control presupuestal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportRows.length === 0 ? (
                <div className="rounded-2xl bg-background/60 px-4 py-8 text-sm text-muted-foreground">
                  No hay registros para los filtros seleccionados.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Alerta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportRows.map((row) => (
                      <TableRow key={row.time_entry_id}>
                        <TableCell>{row.employee_name}</TableCell>
                        <TableCell>{row.area}</TableCell>
                        <TableCell>{row.work_date}</TableCell>
                        <TableCell>{formatHours(row.total_hours)}</TableCell>
                        <TableCell>{formatCurrency(row.total_value)}</TableCell>
                        <TableCell>
                          <Badge variant={row.legal_alert ? "destructive" : "secondary"}>
                            {row.legal_alert ? "Con alerta" : "OK"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cumplimiento">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle>Jornadas con alertas legales</CardTitle>
                <CardDescription>
                  Seguimiento prioritario para topes, menores e inconsistencias.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alertRows.length === 0 ? (
                  <div className="rounded-2xl bg-green-500/10 px-4 py-8 text-sm text-green-300">
                    No hay jornadas con alertas para este corte.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alertRows.map((row) => (
                      <div
                        key={row.time_entry_id}
                        className="rounded-2xl border border-border bg-background/50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {row.employee_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {row.work_date} | {row.check_in} - {row.check_out}
                            </p>
                          </div>
                          <Badge variant="destructive">
                            <ShieldAlert className="mr-1 h-3 w-3" />
                            Revisión necesaria
                          </Badge>
                        </div>
                        <div className="mt-3 text-sm text-muted-foreground">
                          Valor del turno: {formatCurrency(row.total_value)} en{" "}
                          {formatHours(row.total_hours)}.
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle>Presión presupuestal</CardTitle>
                <CardDescription>
                  Visibilidad del costo extra ya causado y el proyectado para fin de mes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border bg-background/50 p-4">
                  <p className="text-sm text-muted-foreground">Real aprobado</p>
                  <p className="mt-2 text-3xl font-display text-foreground">
                    {formatCurrency(projection.actual_extra_cost)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background/50 p-4">
                  <p className="text-sm text-muted-foreground">Pendiente por aprobar</p>
                  <p className="mt-2 text-3xl font-display text-foreground">
                    {formatCurrency(projection.pending_extra_cost)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Proyección del mes
                  </div>
                  <p className="mt-2 text-3xl font-display text-foreground">
                    {formatCurrency(projection.projected_month_end_extra_cost)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Basado en jornadas aprobadas y solicitudes pendientes del corte {selectedMonth}.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="auditoria">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Auditoría</CardTitle>
              <CardDescription>
                Eventos de autenticación, maestros, marcaciones y aprobaciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!permissions.canViewAudit ? (
                <div className="rounded-2xl bg-background/60 px-4 py-8 text-sm text-muted-foreground">
                  Tu rol no tiene acceso al log de auditoría.
                </div>
              ) : auditEvents.length === 0 ? (
                <div className="rounded-2xl bg-background/60 px-4 py-8 text-sm text-muted-foreground">
                  Aún no hay eventos para mostrar.
                </div>
              ) : (
                <div className="space-y-3">
                  {auditEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-border bg-background/50 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {event.action}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {event.entityType}
                            {event.entityId ? ` | ${event.entityId}` : ""}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {formatShortDateTime(event.createdAt)}
                        </Badge>
                      </div>
                      {event.after ? (
                        <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/20 p-3 text-xs text-muted-foreground">
                          {JSON.stringify(event.after, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exportacion">
          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-6">
              <Card className="bg-card/80">
                <CardHeader>
                  <CardTitle>Exportar datos</CardTitle>
                  <CardDescription>
                    Descarga CSV, JSON o Excel listos para conciliación y carga externa.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-between"
                    onClick={() => void handleExport("xlsx")}
                    disabled={isExporting}
                  >
                    Exportar reporte Excel
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => void handleExport("csv")}
                    disabled={isExporting}
                  >
                    Exportar reporte CSV
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => void handleExport("json")}
                    disabled={isExporting}
                  >
                    Exportar reporte JSON
                    <FileJson className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/80">
                <CardHeader>
                  <CardTitle>Incluido en la exportación</CardTitle>
                  <CardDescription>
                    Cobertura del corte preparado para operación y nómina.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    `Empleados cubiertos: ${summary.total_employees}`,
                    `Jornadas incluidas: ${summary.total_time_entries}`,
                    `Horas liquidadas: ${formatHours(summary.total_hours)}`,
                    `Alertas legales: ${summary.legal_alerts}`,
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-2xl border border-border bg-background/50 px-4 py-3 text-sm"
                    >
                      <span className="text-foreground">{item}</span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-card/80">
                <CardHeader>
                  <CardTitle>Conectores salientes</CardTitle>
                  <CardDescription>
                    Envía el corte a contabilidad o nómina mediante webhook JSON.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={connectorForm.name}
                      onChange={(event) =>
                        setConnectorForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nombre del conector"
                      disabled={!permissions.canManageSettings}
                    />
                    <Input
                      value={connectorForm.provider}
                      onChange={(event) =>
                        setConnectorForm((current) => ({
                          ...current,
                          provider: event.target.value,
                        }))
                      }
                      placeholder="Proveedor o ERP"
                      disabled={!permissions.canManageSettings}
                    />
                    <Input
                      value={connectorForm.endpointUrl}
                      onChange={(event) =>
                        setConnectorForm((current) => ({
                          ...current,
                          endpointUrl: event.target.value,
                        }))
                      }
                      placeholder="https://..."
                      disabled={!permissions.canManageSettings}
                    />
                    <Input
                      value={connectorForm.authToken}
                      onChange={(event) =>
                        setConnectorForm((current) => ({
                          ...current,
                          authToken: event.target.value,
                        }))
                      }
                      placeholder="Token opcional"
                      disabled={!permissions.canManageSettings}
                    />
                  </div>
                  <Button
                    onClick={() => void handleSaveConnector()}
                    disabled={!permissions.canManageSettings || isSavingConnector}
                  >
                    <Link2 className="h-4 w-4" />
                    {isSavingConnector ? "Guardando..." : "Guardar conector"}
                  </Button>

                  <div className="space-y-3">
                    {connectors.length === 0 ? (
                      <div className="rounded-2xl bg-background/60 px-4 py-6 text-sm text-muted-foreground">
                        No hay conectores configurados todavía.
                      </div>
                    ) : (
                      connectors.map((connector) => (
                        <div
                          key={connector.id}
                          className="rounded-2xl border border-border bg-background/50 p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {connector.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {connector.provider} | {connector.endpoint_url}
                              </p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                Último envío:{" "}
                                {connector.last_delivery_at
                                  ? `${formatShortDateTime(connector.last_delivery_at)} (${connector.last_delivery_status ?? "sin estado"})`
                                  : "sin historial"}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => void handleDispatchConnector(connector.id)}
                              disabled={dispatchingConnectorId === connector.id}
                            >
                              <Send className="h-4 w-4" />
                              {dispatchingConnectorId === connector.id
                                ? "Enviando..."
                                : "Enviar corte"}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
