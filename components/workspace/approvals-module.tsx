"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, MessageSquareQuote, ShieldAlert, XCircle } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/fetch-json";
import {
  approveAttendanceRequest,
  getCostProjection,
  listAttendanceRequests,
  rejectAttendanceRequest,
  type AttendanceRequestResponse,
  type CostProjectionResponse,
} from "@/lib/tempo-api";
import { formatCurrency, formatHours, formatShortDateTime } from "@/lib/tempo-format";

type DecisionMap = Record<string, string>;

const emptyProjection: CostProjectionResponse = {
  month_label: "",
  actual_extra_cost: 0,
  pending_extra_cost: 0,
  projected_month_end_extra_cost: 0,
  approved_hours: 0,
  pending_hours: 0,
};

export function ApprovalsModule() {
  const { permissions } = useAuth();
  const [requests, setRequests] = useState<AttendanceRequestResponse[]>([]);
  const [projection, setProjection] = useState<CostProjectionResponse>(emptyProjection);
  const [decisionComments, setDecisionComments] = useState<DecisionMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "pending"),
    [requests],
  );

  async function refreshData() {
    try {
      setIsLoading(true);
      const [attendanceRequests, costProjection] = await Promise.all([
        listAttendanceRequests(),
        getCostProjection(),
      ]);
      setRequests(attendanceRequests);
      setProjection(costProjection);
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!permissions.canApproveAttendance) {
      return;
    }
    void refreshData();
  }, [permissions.canApproveAttendance]);

  async function handleDecision(
    request: AttendanceRequestResponse,
    decision: "approve" | "reject",
  ) {
    const comment = decisionComments[request.id]?.trim() ?? "";
    if (comment.length < 2) {
      setMessage("Agrega un comentario corto antes de aprobar o rechazar la jornada.");
      return;
    }

    try {
      setIsSubmitting(request.id);
      setMessage("");
      if (decision === "approve") {
        await approveAttendanceRequest(request.id, { comment });
      } else {
        await rejectAttendanceRequest(request.id, { comment });
      }
      setDecisionComments((current) => ({ ...current, [request.id]: "" }));
      await refreshData();
      setMessage(
        decision === "approve"
          ? "Jornada aprobada y llevada al historial oficial."
          : "Jornada rechazada con comentario para seguimiento.",
      );
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(null);
    }
  }

  if (!permissions.canApproveAttendance) {
    return (
      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Aprobaciones</CardTitle>
          <CardDescription>
            Este panel esta disponible para administracion, nomina y supervisores.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Solicitudes pendientes</CardDescription>
            <CardTitle className="text-3xl font-display">{pendingRequests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Costo extra pendiente</CardDescription>
            <CardTitle className="text-3xl font-display">
              {formatCurrency(projection.pending_extra_cost)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Proyeccion fin de mes</CardDescription>
            <CardTitle className="text-3xl font-display">
              {formatCurrency(projection.projected_month_end_extra_cost)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Horas pendientes</CardDescription>
            <CardTitle className="text-3xl font-display">
              {formatHours(projection.pending_hours)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {message ? (
        <div className="rounded-2xl bg-background/60 px-4 py-3 text-sm text-muted-foreground">
          {message}
        </div>
      ) : null}

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Panel de aprobacion</CardTitle>
          <CardDescription>
            Revisa jornadas fuera de lo programado, comenta y decide antes de llevarlas a nomina.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="rounded-2xl bg-background/60 px-4 py-8 text-sm text-muted-foreground">
              Cargando solicitudes...
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="rounded-2xl bg-green-500/10 px-4 py-8 text-sm text-green-300">
              No hay solicitudes pendientes. El flujo de aprobacion esta al dia.
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-3xl border border-border bg-background/50 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-medium text-foreground">
                        {request.employee_name}
                      </p>
                      <Badge variant="secondary">{request.verification_method}</Badge>
                      {request.requires_justification ? (
                        <Badge variant="destructive">
                          <ShieldAlert className="mr-1 h-3 w-3" />
                          Requiere justificacion
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatShortDateTime(request.check_in_at)} a{" "}
                      {request.check_out_at
                        ? formatShortDateTime(request.check_out_at)
                        : "turno abierto"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sitio: {request.worksite_name ?? "registro directo"} | Costo extra proyectado:{" "}
                      {formatCurrency(request.projected_extra_cost)}
                    </p>
                    {request.justification ? (
                      <div className="rounded-2xl bg-secondary/50 px-4 py-3 text-sm text-foreground">
                        <span className="font-medium">Justificacion:</span> {request.justification}
                      </div>
                    ) : null}
                  </div>

                  {request.preview ? (
                    <div className="min-w-72 rounded-2xl border border-border bg-card/70 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Preview legal
                      </p>
                      <p className="mt-2 text-lg font-semibold text-foreground">
                        {formatCurrency(request.preview.valor_total_dia)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatHours(request.preview.horas_totales_dia)} |{" "}
                        {request.preview.alerta_limite_legal ? "Con alerta" : "Sin alerta"}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 space-y-3">
                  <Textarea
                    value={decisionComments[request.id] ?? ""}
                    onChange={(event) =>
                      setDecisionComments((current) => ({
                        ...current,
                        [request.id]: event.target.value,
                      }))
                    }
                    placeholder="Comentario obligatorio del supervisor o equipo de nomina"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={() => void handleDecision(request, "approve")}
                      disabled={isSubmitting === request.id}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Aprobar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void handleDecision(request, "reject")}
                      disabled={isSubmitting === request.id}
                    >
                      <XCircle className="h-4 w-4" />
                      Rechazar
                    </Button>
                    <Badge variant="outline" className="sm:ml-auto">
                      <MessageSquareQuote className="mr-1 h-3 w-3" />
                      Comentario requerido
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
