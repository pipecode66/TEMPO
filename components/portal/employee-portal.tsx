"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  LogOut,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
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
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/fetch-json";
import {
  endEmployeeShift,
  getEmployeePortalSummary,
  startEmployeeShift,
  type EmployeePortalSummaryResponse,
  type GeoCaptureRequest,
} from "@/lib/tempo-api";
import { formatCurrency, formatHours, formatShortDateTime } from "@/lib/tempo-format";

const emptySummary: EmployeePortalSummaryResponse = {
  employee_name: "",
  employee_email: null,
  worksite_options: [],
  current_shift: null,
  pending_requests: [],
  approved_entries: [],
  month_extra_cost: 0,
  month_hours: 0,
};

function getCurrentPosition(): Promise<GeoCaptureRequest> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Este dispositivo no soporta geolocalizacion."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy_meters: position.coords.accuracy,
        }),
      () => reject(new Error("No fue posible obtener tu ubicacion actual.")),
      {
        enableHighAccuracy: true,
        timeout: 15000,
      },
    );
  });
}

export function EmployeePortal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout, user, isLoading: isAuthLoading } = useAuth();
  const [summary, setSummary] = useState<EmployeePortalSummaryResponse>(emptySummary);
  const [qrToken, setQrToken] = useState(searchParams.get("qr") ?? "");
  const [notes, setNotes] = useState("");
  const [justification, setJustification] = useState("");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<"start" | "end" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const pendingValue = useMemo(
    () =>
      summary.pending_requests.reduce(
        (total, request) => total + request.projected_extra_cost,
        0,
      ),
    [summary.pending_requests],
  );

  async function refreshSummary() {
    try {
      setIsLoading(true);
      const nextSummary = await getEmployeePortalSummary();
      setSummary(nextSummary);
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthLoading && !user) {
      startTransition(() => {
        router.replace("/");
      });
      return;
    }
    if (!isAuthLoading && user && user.role !== "consulta") {
      startTransition(() => {
        router.replace("/dashboard");
      });
      return;
    }
    if (!isAuthLoading && user?.role === "consulta") {
      void refreshSummary();
    }
  }, [isAuthLoading, router, user]);

  useEffect(() => {
    const token = searchParams.get("qr");
    if (token) {
      setQrToken(token);
    }
  }, [searchParams]);

  async function handleStartShift() {
    try {
      setIsSubmitting("start");
      setMessage("");
      const geo = await getCurrentPosition();
      await startEmployeeShift({
        qr_token: qrToken || null,
        geo,
        notes: notes || null,
      });
      setNotes("");
      await refreshSummary();
      setMessage("Jornada iniciada correctamente.");
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(null);
    }
  }

  async function handleEndShift() {
    try {
      setIsSubmitting("end");
      setMessage("");
      const geo = await getCurrentPosition();
      await endEmployeeShift({
        geo,
        notes: notes || null,
        justification: justification || null,
      });
      setNotes("");
      setJustification("");
      await refreshSummary();
      setMessage("Jornada finalizada y enviada a aprobacion.");
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(null);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-background px-5 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Portal del empleado
            </p>
            <h1 className="mt-3 font-display text-4xl text-foreground">
              {summary.employee_name || user?.full_name || "Autoservicio"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Marca inicio y fin de jornada con geolocalizacion, revisa tus solicitudes
              pendientes y sigue el acumulado de horas y recargos del mes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{summary.employee_email ?? user?.email}</Badge>
            <Badge variant={summary.current_shift ? "destructive" : "outline"}>
              {summary.current_shift ? "Turno activo" : "Sin turno abierto"}
            </Badge>
            <Button variant="outline" onClick={() => void handleLogout()}>
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="bg-card/80">
            <CardHeader className="space-y-1">
              <CardDescription>Horas del mes</CardDescription>
              <CardTitle className="text-3xl font-display">
                {formatHours(summary.month_hours)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/80">
            <CardHeader className="space-y-1">
              <CardDescription>Recargos acumulados</CardDescription>
              <CardTitle className="text-3xl font-display">
                {formatCurrency(summary.month_extra_cost)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/80">
            <CardHeader className="space-y-1">
              <CardDescription>Solicitudes pendientes</CardDescription>
              <CardTitle className="text-3xl font-display">
                {summary.pending_requests.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/80">
            <CardHeader className="space-y-1">
              <CardDescription>Valor pendiente</CardDescription>
              <CardTitle className="text-3xl font-display">
                {formatCurrency(pendingValue)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Marcacion simple</CardTitle>
              <CardDescription>
                Usa QR si vienes desde campo. La ubicacion se toma al iniciar y finalizar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <QrCode className="h-4 w-4" />
                    Token QR
                  </div>
                  <Input
                    value={qrToken}
                    onChange={(event) => setQrToken(event.target.value)}
                    placeholder="Se carga automaticamente al escanear"
                    className="mt-3"
                  />
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Estado
                  </div>
                  <p className="mt-3 text-sm text-foreground">
                    {summary.current_shift
                      ? `Turno iniciado ${formatShortDateTime(summary.current_shift.check_in_at)}`
                      : "Aun no has iniciado tu jornada."}
                  </p>
                </div>
              </div>

              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Notas opcionales del turno"
              />

              {summary.current_shift ? (
                <Textarea
                  value={justification}
                  onChange={(event) => setJustification(event.target.value)}
                  placeholder="Justifica si el turno fue no programado, festivo o extendido"
                />
              ) : null}

              {message ? (
                <div className="rounded-2xl bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                  {message}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => void handleStartShift()}
                  disabled={Boolean(summary.current_shift) || isSubmitting !== null || isLoading}
                >
                  <Clock3 className="h-4 w-4" />
                  {isSubmitting === "start" ? "Iniciando..." : "Iniciar jornada"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleEndShift()}
                  disabled={!summary.current_shift || isSubmitting !== null || isLoading}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isSubmitting === "end" ? "Finalizando..." : "Finalizar jornada"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Mis solicitudes y acumulado</CardTitle>
              <CardDescription>
                Transparencia para el empleado sobre lo enviado a aprobacion y lo ya consolidado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border bg-background/50 p-4">
                <p className="text-sm font-medium text-foreground">Pendientes</p>
                {summary.pending_requests.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No tienes solicitudes pendientes de aprobacion.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {summary.pending_requests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-2xl bg-card/70 px-4 py-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-foreground">
                            {formatShortDateTime(request.check_in_at)}
                          </span>
                          <Badge variant="secondary">{request.status}</Badge>
                        </div>
                        <p className="mt-2 text-muted-foreground">
                          Proyeccion extra: {formatCurrency(request.projected_extra_cost)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-background/50 p-4">
                <p className="text-sm font-medium text-foreground">Historial reciente</p>
                {summary.approved_entries.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Aun no hay jornadas aprobadas para mostrar.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {summary.approved_entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-2xl bg-card/70 px-4 py-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-foreground">{entry.work_date}</span>
                          <Badge variant="outline">
                            {formatHours(entry.calculation_result.horas_totales_dia)}
                          </Badge>
                        </div>
                        <p className="mt-2 text-muted-foreground">
                          Turno {entry.check_in.slice(0, 5)} - {entry.check_out.slice(0, 5)} |{" "}
                          {formatCurrency(entry.calculation_result.valor_total_dia)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-secondary/50 px-4 py-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  Seguimiento visible
                </div>
                <p className="mt-2">
                  Tus recargos del mes van en {formatCurrency(summary.month_extra_cost)} y las
                  horas aprobadas suman {formatHours(summary.month_hours)}.
                </p>
              </div>

              <div className="rounded-2xl bg-background/60 px-4 py-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Experiencia pensada para campo
                </div>
                <p className="mt-2">
                  Si escaneaste un QR del sitio, el token queda listo y la geolocalizacion se
                  adjunta automaticamente al marcar.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
