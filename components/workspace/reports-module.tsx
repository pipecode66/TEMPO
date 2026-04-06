"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatHours } from "@/lib/tempo-format";
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
  const { employees, timeEntries, companyProfile } = useTempoWorkspace();
  const [feedback, setFeedback] = useState("");

  const complianceRate =
    timeEntries.length === 0
      ? 100
      : Math.round(
          ((timeEntries.length -
            timeEntries.filter((entry) => entry.response.alerta_limite_legal).length) /
            timeEntries.length) *
            100,
        );

  const totalLiquidatedValue = timeEntries.reduce(
    (total, entry) => total + entry.response.valor_total_dia,
    0,
  );
  const totalHours = timeEntries.reduce(
    (total, entry) => total + entry.response.horas_totales_dia,
    0,
  );

  const employeeSummary = employees.map((employee) => {
    const employeeEntries = timeEntries.filter((entry) => entry.employeeId === employee.id);

    return {
      id: employee.id,
      nombre: employee.nombre,
      area: employee.area,
      jornadas: employeeEntries.length,
      horas: employeeEntries.reduce(
        (total, entry) => total + entry.response.horas_totales_dia,
        0,
      ),
      valor: employeeEntries.reduce(
        (total, entry) => total + entry.response.valor_total_dia,
        0,
      ),
      alertas: employeeEntries.filter((entry) => entry.response.alerta_limite_legal).length,
    };
  });

  const alertEntries = timeEntries.filter((entry) => entry.response.alerta_limite_legal);

  function exportJson() {
    downloadFile(
      "tempo-reporte-resumen.json",
      JSON.stringify(
        {
          empresa: companyProfile,
          empleados: employees,
          jornadas: timeEntries,
          resumen: {
            cumplimiento: complianceRate,
            valorLiquidado: totalLiquidatedValue,
            horasLiquidadas: totalHours,
          },
        },
        null,
        2,
      ),
      "application/json",
    );
    setFeedback("Resumen exportado en JSON.");
  }

  function exportCsv() {
    const header = [
      "fecha",
      "empleado",
      "area",
      "entrada",
      "salida",
      "horas_totales",
      "valor_total_dia",
      "alerta_legal",
    ];

    const rows = timeEntries.map((entry) =>
      [
        entry.fecha,
        entry.employeeName,
        entry.area,
        entry.horaEntrada,
        entry.horaSalida,
        entry.response.horas_totales_dia,
        entry.response.valor_total_dia,
        entry.response.alerta_limite_legal ? "si" : "no",
      ].join(","),
    );

    downloadFile(
      "tempo-jornadas.csv",
      [header.join(","), ...rows].join("\n"),
      "text/csv;charset=utf-8",
    );
    setFeedback("Historico exportado en CSV.");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Cumplimiento</CardDescription>
            <CardTitle className="text-3xl font-display">{complianceRate}%</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Horas liquidadas</CardDescription>
            <CardTitle className="text-3xl font-display">{formatHours(totalHours)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Valor acumulado</CardDescription>
            <CardTitle className="text-3xl font-display">
              {formatCurrency(totalLiquidatedValue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Jornadas con alerta</CardDescription>
            <CardTitle className="text-3xl font-display">{alertEntries.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="cumplimiento">Cumplimiento</TabsTrigger>
          <TabsTrigger value="exportacion">Exportacion</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Resumen por empleado</CardTitle>
              <CardDescription>
                Consolida jornadas, horas liquidadas y valor generado por persona.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeeSummary.length === 0 ? (
                <div className="rounded-2xl bg-background/60 px-4 py-8 text-sm text-muted-foreground">
                  Agrega empleados y registra jornadas para construir el primer reporte.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Jornadas</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Alertas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeSummary.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.nombre}</TableCell>
                        <TableCell>{row.area}</TableCell>
                        <TableCell>{row.jornadas}</TableCell>
                        <TableCell>{formatHours(row.horas)}</TableCell>
                        <TableCell>{formatCurrency(row.valor)}</TableCell>
                        <TableCell>
                          <Badge variant={row.alertas > 0 ? "destructive" : "secondary"}>
                            {row.alertas}
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
                Seguimiento prioritario para topes de extras, menores o alertas de configuracion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertEntries.length === 0 ? (
                <div className="rounded-2xl bg-green-500/10 px-4 py-8 text-sm text-green-300">
                  No hay jornadas con alertas. El entorno mantiene un pulso saludable.
                </div>
              ) : (
                <div className="space-y-3">
                  {alertEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-border bg-background/50 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {entry.employeeName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.fecha} | {entry.horaEntrada} - {entry.horaSalida}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          <ShieldCheck className="h-3 w-3" />
                          Revision necesaria
                        </Badge>
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {entry.response.alertas.map((alert) => (
                          <li key={alert}>{alert}</li>
                        ))}
                      </ul>
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
                  Descarga un snapshot del workspace para auditoria, nomina o respaldo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-between" onClick={exportJson}>
                  Exportar resumen JSON
                  <FileJson className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={exportCsv}>
                  Exportar jornadas CSV
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
                {feedback ? (
                  <div className="rounded-2xl bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                    {feedback}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle>Incluido en la exportacion</CardTitle>
                <CardDescription>
                  Cobertura actual del paquete descargable.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  `Empresa: ${companyProfile.nombreLegal || "pendiente"}`,
                  `Empleados: ${employees.length}`,
                  `Jornadas: ${timeEntries.length}`,
                  `Alertas legales: ${alertEntries.length}`,
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
