"use client";

import { useState } from "react";
import { CalendarDays, Clock3, ShieldAlert, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatHours, formatLongDate, formatShortDate } from "@/lib/tempo-format";
import { useTempoWorkspace } from "@/components/workspace/tempo-provider";

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CalendarModule() {
  const { timeEntries } = useTempoWorkspace();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const selectedDateKey = toIsoDate(selectedDate);
  const selectedEntries = timeEntries.filter((entry) => entry.fecha === selectedDateKey);
  const highlightedDays = timeEntries.map((entry) => new Date(`${entry.fecha}T00:00:00`));
  const alertDays = timeEntries
    .filter((entry) => entry.response.alerta_limite_legal)
    .map((entry) => new Date(`${entry.fecha}T00:00:00`));

  const monthlyEntries = timeEntries.filter((entry) =>
    entry.fecha.startsWith(selectedDateKey.slice(0, 7)),
  );
  const monthlyHours = monthlyEntries.reduce(
    (total, entry) => total + entry.response.horas_totales_dia,
    0,
  );
  const monthlyAlerts = monthlyEntries.filter(
    (entry) => entry.response.alerta_limite_legal,
  ).length;
  const uniqueEmployees = new Set(monthlyEntries.map((entry) => entry.employeeName)).size;

  const weeklyOverview = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(selectedDate);
    date.setDate(selectedDate.getDate() - 3 + index);
    const key = toIsoDate(date);
    const entries = timeEntries.filter((entry) => entry.fecha === key);
    return {
      key,
      label: formatShortDate(key),
      count: entries.length,
      hours: entries.reduce((total, entry) => total + entry.response.horas_totales_dia, 0),
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Jornadas del dia seleccionado</CardDescription>
            <CardTitle className="text-3xl font-display">{selectedEntries.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Horas del mes</CardDescription>
            <CardTitle className="text-3xl font-display">{formatHours(monthlyHours)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Alertas del mes</CardDescription>
            <CardTitle className="text-3xl font-display">{monthlyAlerts}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Personas con marcaciones</CardDescription>
            <CardTitle className="text-3xl font-display">{uniqueEmployees}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Calendario operativo</CardTitle>
            <CardDescription>
              Las fechas con registros se resaltan y las alertas legales quedan marcadas aparte.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                }
              }}
              modifiers={{
                recorded: highlightedDays,
                alert: alertDays,
              }}
              modifiersClassNames={{
                recorded: "bg-secondary text-foreground",
                alert: "bg-red-500/20 text-red-300",
              }}
              className="rounded-3xl border border-border bg-background/40"
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>{formatLongDate(selectedDateKey)}</CardTitle>
              <CardDescription>
                Detalle de jornadas registradas para la fecha seleccionada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedEntries.length === 0 ? (
                <div className="rounded-2xl bg-background/60 px-4 py-6 text-sm text-muted-foreground">
                  No hay jornadas registradas para este dia.
                </div>
              ) : (
                selectedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-border bg-background/60 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {entry.employeeName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.area} | {entry.horaEntrada} - {entry.horaSalida}
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
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Horas</p>
                        <p className="text-sm text-foreground">
                          {formatHours(entry.response.horas_totales_dia)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="text-sm text-foreground">
                          {formatCurrency(entry.response.valor_total_dia)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tipo</p>
                        <p className="text-sm text-foreground">
                          {entry.esFestivo ? "Festivo" : entry.esDominical ? "Dominical" : "Laboral"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Semana alrededor de la fecha</CardTitle>
              <CardDescription>
                Lectura rapida de actividad para planeacion y seguimiento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {weeklyOverview.map((day) => (
                <div
                  key={day.key}
                  className="flex items-center justify-between rounded-2xl border border-border bg-background/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{day.label}</p>
                      <p className="text-xs text-muted-foreground">{day.count} jornadas</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{formatHours(day.hours)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card/80">
              <CardContent className="flex items-center gap-3 pt-6">
                <Clock3 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Mes actual</p>
                  <p className="text-sm font-medium text-foreground">
                    {monthlyEntries.length} registros
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/80">
              <CardContent className="flex items-center gap-3 pt-6">
                <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Alertas</p>
                  <p className="text-sm font-medium text-foreground">{monthlyAlerts} casos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/80">
              <CardContent className="flex items-center gap-3 pt-6">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Cobertura</p>
                  <p className="text-sm font-medium text-foreground">
                    {uniqueEmployees} personas
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
