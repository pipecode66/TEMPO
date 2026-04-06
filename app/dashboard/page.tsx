"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type StatTone = "neutral" | "positive";

type DashboardStat = {
  label: string;
  value: string;
  helper: string;
  tone: StatTone;
  icon: typeof Users;
};

type ActivityItem = {
  name: string;
  action: string;
  time: string;
  department: string;
  status: "on-time" | "late" | "overtime" | "pending" | "approved";
};

type AlertItem = {
  type: "warning" | "info" | "success";
  message: string;
};

const statsData: DashboardStat[] = [
  {
    label: "Empleados activos",
    value: "0",
    helper: "Sin datos",
    tone: "neutral",
    icon: Users,
  },
  {
    label: "Horas registradas hoy",
    value: "0",
    helper: "Sin registros",
    tone: "neutral",
    icon: Clock,
  },
  {
    label: "Horas extras en la semana",
    value: "0",
    helper: "Sin novedades",
    tone: "neutral",
    icon: TrendingUp,
  },
  {
    label: "Alertas activas",
    value: "0",
    helper: "Todo al dia",
    tone: "positive",
    icon: AlertTriangle,
  },
];

const recentActivity: ActivityItem[] = [];
const quickAlerts: AlertItem[] = [];

const setupSteps = [
  {
    icon: Users,
    title: "Registra tus empleados",
    description: "Crea la base de personal para empezar a controlar jornadas reales.",
  },
  {
    icon: Calendar,
    title: "Configura la jornada",
    description: "Define horarios, distribucion semanal y reglas internas de operacion.",
  },
  {
    icon: FileText,
    title: "Carga los primeros turnos",
    description: "Cuando existan registros, Tempo calculara horas y alertas automaticamente.",
  },
];

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="border-b border-border p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-7 w-7 text-foreground" />
            <span className="font-display text-xl tracking-tight text-foreground">Tempo</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg bg-secondary px-4 py-3 text-foreground"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
              >
                <Users className="h-5 w-5" />
                <span className="text-sm">Empleados</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
              >
                <Clock className="h-5 w-5" />
                <span className="text-sm">Control de tiempos</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
              >
                <Calendar className="h-5 w-5" />
                <span className="text-sm">Calendario</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
              >
                <FileText className="h-5 w-5" />
                <span className="text-sm">Reportes</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
              >
                <Building2 className="h-5 w-5" />
                <span className="text-sm">Empresa</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
                <span className="text-sm">Configuracion</span>
              </a>
            </li>
          </ul>
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <span className="text-sm font-medium text-foreground">AD</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">admin@empresa.com</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
            <Link href="/">
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 lg:hidden">
                <Clock className="h-6 w-6 text-foreground" />
                <span className="font-display text-lg text-foreground">Tempo</span>
              </div>
              <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 sm:flex">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar modulos y reportes..."
                  className="w-64 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 md:flex">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm text-foreground">
                  {currentTime.toLocaleTimeString("es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {currentTime.getHours() >= 19 || currentTime.getHours() < 6 ? (
                  <Moon className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Sun className="h-3 w-3 text-muted-foreground" />
                )}
              </div>

              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] text-foreground">
                  0
                </span>
              </Button>

              <button className="hidden items-center gap-2 rounded-lg px-3 py-1.5 transition-colors hover:bg-card lg:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                  <span className="text-xs font-medium text-foreground">AD</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-display text-foreground lg:text-3xl">
              Bienvenido al panel de control
            </h1>
            <p className="mt-1 text-muted-foreground">
              Hoy es{" "}
              {currentTime.toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              . Empieza a registrar tu informacion real desde este panel.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/20"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-secondary p-2">
                    <stat.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      stat.tone === "positive"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {stat.helper}
                  </span>
                </div>
                <p className="mt-4 font-display text-3xl text-foreground">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card lg:col-span-2">
              <div className="border-b border-border p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-foreground">Actividad reciente</h2>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Ver todo
                  </Button>
                </div>
              </div>

              {recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-base font-medium text-foreground">
                    No hay actividad registrada
                  </h3>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Cuando empieces a cargar empleados, jornadas o novedades, aqui
                    aparecera el historial reciente del sistema.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={`${activity.name}-${activity.time}-${index}`}
                      className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                          <span className="text-xs font-medium text-foreground">
                            {activity.name
                              .split(" ")
                              .map((namePart) => namePart[0])
                              .join("")}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{activity.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.action} - {activity.department}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            activity.status === "on-time"
                              ? "bg-green-500"
                              : activity.status === "late"
                                ? "bg-red-500"
                                : activity.status === "overtime"
                                  ? "bg-yellow-500"
                                  : activity.status === "approved"
                                    ? "bg-green-500"
                                    : "bg-muted-foreground"
                          }`}
                        />
                        <span className="font-mono text-sm text-muted-foreground">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card">
                <div className="border-b border-border p-6">
                  <h2 className="text-lg font-medium text-foreground">Alertas del sistema</h2>
                </div>

                {quickAlerts.length === 0 ? (
                  <div className="p-6">
                    <div className="rounded-lg bg-secondary p-4">
                      <p className="text-sm font-medium text-foreground">
                        No hay alertas activas.
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Las alertas apareceran aqui cuando existan novedades legales
                        o registros que requieran atencion.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {quickAlerts.map((alert, index) => (
                      <div
                        key={`${alert.type}-${index}`}
                        className={`flex items-start gap-3 rounded-lg p-3 ${
                          alert.type === "warning"
                            ? "bg-yellow-500/10"
                            : alert.type === "success"
                              ? "bg-green-500/10"
                              : "bg-secondary"
                        }`}
                      >
                        {alert.type === "warning" ? (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                        ) : alert.type === "success" ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        ) : (
                          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <p className="text-sm text-foreground">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Primeros pasos
                </h3>
                <div className="space-y-4">
                  {setupSteps.map((step) => (
                    <div key={step.title} className="flex items-start gap-3">
                      <div className="rounded-lg bg-secondary p-2">
                        <step.icon className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Configuracion actual
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Jornada maxima</span>
                    <span className="text-sm font-medium text-foreground">42h/semana</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Horario nocturno</span>
                    <span className="text-sm font-medium text-foreground">19:00 - 06:00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Extras maximas</span>
                    <span className="text-sm font-medium text-foreground">12h/semana</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ley vigente</span>
                    <span className="text-sm font-medium text-foreground">Julio 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
