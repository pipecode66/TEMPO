"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  formatCurrency,
  formatHours,
  formatLongDate,
  formatShortDateTime,
} from "@/lib/tempo-format";
import { useTempoWorkspace } from "@/components/workspace/tempo-provider";

function getOnboardingScore(checks: boolean[]): number {
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

export function DashboardOverview() {
  const { employees, timeEntries, companyProfile, policySettings } = useTempoWorkspace();

  const activeEmployees = employees.filter((employee) => employee.estado === "activo");
  const protectedMinors = employees.filter((employee) => employee.edad <= 17);
  const alertEntries = timeEntries.filter((entry) => entry.response.alerta_limite_legal);
  const totalPayrollBase = employees.reduce(
    (total, employee) => total + employee.salarioBase,
    0,
  );
  const totalRecordedHours = timeEntries.reduce(
    (total, entry) => total + entry.response.horas_totales_dia,
    0,
  );

  const onboardingChecks = [
    companyProfile.nombreLegal.length > 0,
    companyProfile.nit.length > 0,
    employees.length > 0,
    timeEntries.length > 0,
  ];
  const onboardingScore = getOnboardingScore(onboardingChecks);

  const priorities = [
    !companyProfile.nombreLegal
      ? {
          title: "Completa el perfil de empresa",
          text: "Carga razon social, NIT y responsables para dejar listo el ambiente operativo.",
          href: "/empresa",
        }
      : null,
    employees.length === 0
      ? {
          title: "Registra el primer empleado",
          text: "Sin colaboradores creados no podras consolidar nomina ni seguimiento de jornadas.",
          href: "/empleados",
        }
      : null,
    timeEntries.length === 0
      ? {
          title: "Liquida la primera jornada",
          text: "Control de tiempos ya esta conectado al motor legal; falta usarlo con datos reales.",
          href: "/control-tiempo",
        }
      : null,
    alertEntries.length > 0
      ? {
          title: "Revisa alertas legales",
          text: `${alertEntries.length} jornadas generaron alertas por topes o restricciones.`,
          href: "/reportes",
        }
      : null,
  ].filter(Boolean) as { title: string; text: string; href: string }[];

  const activityFeed = [
    ...timeEntries.slice(0, 4).map((entry) => ({
      id: `time-${entry.id}`,
      title: entry.employeeName,
      description: `${entry.horaEntrada} - ${entry.horaSalida} | ${
        entry.response.alerta_limite_legal ? "con alerta" : "sin alerta"
      }`,
      date: formatShortDateTime(entry.createdAt),
      tone: entry.response.alerta_limite_legal ? "alert" : "ok",
    })),
    ...employees.slice(0, 3).map((employee) => ({
      id: `employee-${employee.id}`,
      title: employee.nombre,
      description: `${employee.cargo} en ${employee.area}`,
      date: formatShortDateTime(employee.createdAt),
      tone: "ok",
    })),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 bg-card/80">
          <CardHeader className="space-y-0">
            <CardDescription>Base de personal</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-display">{employees.length}</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {activeEmployees.length} activos y {protectedMinors.length} menores protegidos.
            </p>
            <Badge variant="secondary">Carga viva del equipo</Badge>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardHeader className="space-y-0">
            <CardDescription>Nomina base mensual</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-display">
                {formatCurrency(totalPayrollBase)}
              </CardTitle>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Proyeccion base segun salarios registrados.
            </p>
            <Badge variant="secondary">Sin recargos incluidos</Badge>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardHeader className="space-y-0">
            <CardDescription>Horas liquidadas</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-display">
                {formatHours(totalRecordedHours)}
              </CardTitle>
              <Clock3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {timeEntries.length} jornadas almacenadas en el historial local.
            </p>
            <Badge variant="secondary">Corte: {formatLongDate(new Date())}</Badge>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardHeader className="space-y-0">
            <CardDescription>Salud de cumplimiento</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-display">
                {timeEntries.length === 0
                  ? "100%"
                  : `${Math.round(((timeEntries.length - alertEntries.length) / timeEntries.length) * 100)}%`}
              </CardTitle>
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {alertEntries.length > 0
                ? `${alertEntries.length} jornadas requieren revision.`
                : "No hay alertas legales pendientes."}
            </p>
            <Badge variant={alertEntries.length > 0 ? "destructive" : "secondary"}>
              {alertEntries.length > 0 ? "Atencion requerida" : "Operacion estable"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/80 bg-card/80">
          <CardHeader className="border-b border-border/80">
            <CardTitle>Actividad del workspace</CardTitle>
            <CardDescription>
              Alta de personal y liquidaciones recientes dentro de la aplicacion.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {activityFeed.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-background/60 px-6 py-10 text-center">
                <Clock3 className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-base font-medium text-foreground">
                  El workspace todavia esta vacio
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Empieza creando empleados y registrando jornadas para poblar este panel.
                </p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button asChild variant="outline">
                    <Link href="/empleados">Crear empleado</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/control-tiempo">Liquidar jornada</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {activityFeed.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-start gap-4">
                      <div
                        className={`mt-1 h-2.5 w-2.5 rounded-full ${
                          item.tone === "alert" ? "bg-red-500" : "bg-green-500"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <span className="text-xs text-muted-foreground">{item.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    {index < activityFeed.length - 1 ? <Separator className="mt-4" /> : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>Puesta en marcha</CardTitle>
              <CardDescription>
                Avance general del entorno operativo para arrancar con datos reales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avance completado</span>
                  <span className="font-medium text-foreground">{onboardingScore}%</span>
                </div>
                <Progress value={onboardingScore} />
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: "Perfil de empresa",
                    done: companyProfile.nombreLegal.length > 0,
                  },
                  {
                    label: "Base de empleados",
                    done: employees.length > 0,
                  },
                  {
                    label: "Historico de jornadas",
                    done: timeEntries.length > 0,
                  },
                  {
                    label: "Politicas legales",
                    done: policySettings.fechaNormativa.length > 0,
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    {item.done ? (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Listo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Pendiente
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>Prioridades sugeridas</CardTitle>
              <CardDescription>
                Recomendaciones automaticas segun el estado actual del workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {priorities.length === 0 ? (
                <div className="rounded-2xl bg-secondary/50 px-4 py-4 text-sm text-muted-foreground">
                  Ya cubriste lo esencial. Continua operando desde control de tiempos y reportes.
                </div>
              ) : (
                priorities.map((priority) => (
                  <Link
                    key={priority.title}
                    href={priority.href}
                    className="block rounded-2xl border border-border bg-background/60 px-4 py-4 transition-colors hover:border-foreground/30"
                  >
                    <p className="text-sm font-medium text-foreground">{priority.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{priority.text}</p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>Accesos rapidos</CardTitle>
              <CardDescription>
                Enlaces directos a las tareas mas frecuentes del operador.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { href: "/empleados", label: "Alta de empleado", icon: Users },
                { href: "/control-tiempo", label: "Registrar jornada", icon: Clock3 },
                { href: "/reportes", label: "Revisar reportes", icon: FileText },
              ].map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant="outline"
                  className="w-full justify-between"
                >
                  <Link href={item.href}>
                    <span className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
