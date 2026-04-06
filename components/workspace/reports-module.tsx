"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  ShieldAlert,
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
  const [isExporting, setIsExporting] = useState(false);

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
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "No fue posible cargar el reporte.",
      );
    }
  }

  async function handleExport(format: "csv" | "json") {
    try {
      setIsExporting(true);
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
            <CardDescription>Jornadas con alerta</CardDescription>
            <CardTitle className="text-3xl font-display">
              {summary.legal_alerts}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Filtros operativos</CardTitle>
          <CardDescription>
            Consulta reportes por fechas, empleado, area y alertas legales.
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
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las areas</SelectItem>
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
            <Button variant="outline" onClick={() => void refreshAudit()} disabled={!permissions.canViewAudit}>
              Refrescar auditoria
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
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          <TabsTrigger value="exportacion">Exportacion</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Detalle consolidado</CardTitle>
              <CardDescription>
                Respuesta server-side preparada para operacion y futura integracion con nomina.
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
                      <TableHead>Area</TableHead>
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
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Jornadas con alertas legales</CardTitle>
              <CardDescription>
                Seguimiento prioritario para topes, proteccion de menores e inconsistencias.
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
                          <ShieldAlert className="h-3 w-3" />
                          Revision necesaria
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
        </TabsContent>

        <TabsContent value="auditoria">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Auditoria</CardTitle>
              <CardDescription>
                Eventos criticos de autenticacion, cambios maestros y movimientos de jornadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!permissions.canViewAudit ? (
                <div className="rounded-2xl bg-background/60 px-4 py-8 text-sm text-muted-foreground">
                  Tu rol no tiene acceso al log de auditoria.
                </div>
              ) : auditEvents.length === 0 ? (
                <div className="rounded-2xl bg-background/60 px-4 py-8 text-sm text-muted-foreground">
                  Aun no hay eventos para mostrar.
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
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle>Exportar datos</CardTitle>
                <CardDescription>
                  Descarga reportes generados por backend en CSV o JSON.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-between"
                  onClick={() => void handleExport("json")}
                  disabled={isExporting}
                >
                  Exportar reporte JSON
                  <FileJson className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => void handleExport("csv")}
                  disabled={isExporting}
                >
                  Exportar reporte CSV
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle>Incluido en la exportacion</CardTitle>
                <CardDescription>
                  Cobertura actual del corte preparado para operacion y nomina.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <div className="rounded-2xl bg-secondary/50 px-4 py-4 text-sm text-muted-foreground">
                  La salida JSON queda lista para conectarse a procesos de nomina o conciliacion.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
