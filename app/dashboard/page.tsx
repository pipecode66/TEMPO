"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Gauge,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  Timer,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type StatTone = "neutral" | "positive" | "warning" | "accent";

type DashboardStat = {
  label: string;
  value: string;
  helper: string;
  change?: string;
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
    label: "Horas extras acumuladas",
    value: "0",
    helper: "Esta semana",
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
    status: "pending",
  },
  {
    icon: Calendar,
    title: "Configura la jornada",
    description: "Define horarios, distribucion semanal y reglas internas de operacion.",
    status: "pending",
  },
  {
    icon: FileText,
    title: "Carga los primeros turnos",
    description: "Cuando existan registros, TEMPO calculara horas y alertas automaticamente.",
    status: "pending",
  },
];

const navItems = [
  { icon: BarChart3, label: "Dashboard", href: "#", active: true },
  { icon: Users, label: "Empleados", href: "#", active: false },
  { icon: Clock, label: "Control de tiempos", href: "#", active: false },
  { icon: Calendar, label: "Calendario", href: "#", active: false },
  { icon: FileText, label: "Reportes", href: "#", active: false },
  { icon: Building2, label: "Empresa", href: "#", active: false },
  { icon: Settings, label: "Configuracion", href: "#", active: false },
];

function TempoLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
          <Timer className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-semibold tracking-tight text-foreground">
          TEMPO
        </span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-primary">
          Enterprise
        </span>
      </div>
    </div>
  );
}

function StatCard({ stat, index }: { stat: DashboardStat; index: number }) {
  const toneStyles = {
    neutral: "bg-secondary text-muted-foreground",
    positive: "bg-tempo-success/10 text-tempo-success",
    warning: "bg-tempo-warning/10 text-tempo-warning",
    accent: "bg-primary/10 text-primary",
  };

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="rounded-xl bg-secondary p-3 transition-colors duration-300 group-hover:bg-primary/10">
            <stat.icon className="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${toneStyles[stat.tone]}`}>
            {stat.helper}
          </span>
        </div>
        
        <div className="mt-6">
          <p className="font-mono text-4xl font-semibold tracking-tight text-foreground">
            {stat.value}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">{stat.label}</p>
        </div>
        
        {stat.change && (
          <div className="mt-4 flex items-center gap-1 text-xs text-tempo-success">
            <ArrowUpRight className="h-3 w-3" />
            <span>{stat.change}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Buenos dias";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 radial-overlay pointer-events-none" />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-border bg-sidebar transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-6">
          <TempoLogo />
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                    item.active ? "text-primary" : ""
                  }`}
                />
                <span className="text-sm font-medium">{item.label}</span>
                {item.active && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary tempo-pulse" />
                )}
              </a>
            ))}
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70">
              <span className="text-sm font-semibold text-primary-foreground">AD</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">admin@empresa.com</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between gap-4 px-4 lg:px-8">
            {/* Mobile menu & search */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 transition-all duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 sm:flex">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar en TEMPO..."
                  className="w-48 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground lg:w-64"
                />
                <kbd className="hidden rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:inline">
                  Ctrl+K
                </kbd>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3">
              {/* Live clock */}
              <div className="hidden items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 md:flex">
                <div className="relative">
                  <Timer className="h-4 w-4 text-primary" />
                  <div className="absolute inset-0 h-4 w-4 animate-ping rounded-full bg-primary opacity-20" />
                </div>
                <span className="font-mono text-sm font-medium text-foreground">
                  {currentTime.toLocaleTimeString("es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                {currentTime.getHours() >= 19 || currentTime.getHours() < 6 ? (
                  <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-tempo-warning" />
                )}
              </div>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-xl border border-border bg-card hover:bg-secondary"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  0
                </span>
              </Button>

              {/* User menu */}
              <button className="hidden items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 transition-all duration-200 hover:border-primary/30 hover:bg-secondary lg:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70">
                  <span className="text-xs font-semibold text-primary-foreground">AD</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Admin</p>
                  <p className="text-[10px] text-muted-foreground">Empresa S.A.</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-8">
          {/* Welcome section */}
          <div className="mb-8 slide-in-up">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">{greeting()}</p>
                <h1 className="mt-1 text-2xl font-semibold text-foreground lg:text-3xl">
                  Panel de Control
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl border-border bg-card hover:bg-secondary"
                >
                  <FileText className="h-4 w-4" />
                  Exportar
                </Button>
                <Button className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                  <Zap className="h-4 w-4" />
                  Acciones rapidas
                </Button>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {statsData.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} />
            ))}
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Activity panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent activity */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-border p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                      <Gauge className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Actividad reciente</h2>
                      <p className="text-sm text-muted-foreground">Ultimas acciones del sistema</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                    Ver todo
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                    <div className="rounded-2xl bg-secondary p-4">
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Sin actividad registrada
                      </h3>
                      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Cuando empieces a cargar empleados, jornadas o novedades, aqui
                        aparecera el historial reciente del sistema.
                      </p>
                    </div>
                    <Button variant="outline" className="mt-2 gap-2 rounded-xl">
                      <Users className="h-4 w-4" />
                      Agregar primer empleado
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={`${activity.name}-${activity.time}-${index}`}
                        className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/50"
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
                                ? "bg-tempo-success"
                                : activity.status === "late"
                                  ? "bg-destructive"
                                  : activity.status === "overtime"
                                    ? "bg-tempo-warning"
                                    : activity.status === "approved"
                                      ? "bg-tempo-success"
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

              {/* Quick metrics */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-tempo-success/10 p-2.5">
                      <TrendingUp className="h-5 w-5 text-tempo-success" />
                    </div>
                    <span className="text-xs font-medium text-tempo-success">Operativo</span>
                  </div>
                  <p className="mt-6 text-2xl font-semibold text-foreground">42h</p>
                  <p className="mt-1 text-sm text-muted-foreground">Jornada maxima semanal</p>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-0 rounded-full bg-tempo-success" />
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Horario nocturno</span>
                  </div>
                  <p className="mt-6 text-2xl font-semibold text-foreground">19:00 - 06:00</p>
                  <p className="mt-1 text-sm text-muted-foreground">Recargo nocturno activo</p>
                  <div className="mt-4 flex items-center gap-2">
                    <Moon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Ley 2101 Colombia</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar panels */}
            <div className="space-y-6">
              {/* Alerts */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="border-b border-border p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-tempo-warning/10 p-2.5">
                      <AlertTriangle className="h-5 w-5 text-tempo-warning" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Alertas</h2>
                  </div>
                </div>

                {quickAlerts.length === 0 ? (
                  <div className="p-6">
                    <div className="rounded-xl bg-secondary/50 p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-tempo-success" />
                        <p className="text-sm font-medium text-foreground">Sin alertas activas</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Las alertas apareceran cuando existan novedades que requieran atencion.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {quickAlerts.map((alert, index) => (
                      <div
                        key={`${alert.type}-${index}`}
                        className={`flex items-start gap-3 rounded-xl p-4 ${
                          alert.type === "warning"
                            ? "bg-tempo-warning/10"
                            : alert.type === "success"
                              ? "bg-tempo-success/10"
                              : "bg-secondary"
                        }`}
                      >
                        {alert.type === "warning" ? (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-tempo-warning" />
                        ) : alert.type === "success" ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-tempo-success" />
                        ) : (
                          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <p className="text-sm text-foreground">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Setup steps */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="border-b border-border p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Primeros pasos
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">Configura TEMPO para tu empresa</p>
                </div>
                <div className="p-4 space-y-3">
                  {setupSteps.map((step, index) => (
                    <div
                      key={step.title}
                      className="group flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-secondary/50"
                    >
                      <div className="relative">
                        <div className="rounded-xl bg-secondary p-2.5 transition-colors group-hover:bg-primary/10">
                          <step.icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                        </div>
                        {index < setupSteps.length - 1 && (
                          <div className="absolute left-1/2 top-full h-4 w-px -translate-x-1/2 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{step.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {step.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Config summary */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-xl bg-secondary p-2.5">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Configuracion
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Jornada maxima</span>
                    <span className="font-mono text-sm font-medium text-foreground">42h/sem</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Horario nocturno</span>
                    <span className="font-mono text-sm font-medium text-foreground">19:00-06:00</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Extras maximas</span>
                    <span className="font-mono text-sm font-medium text-foreground">12h/sem</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Normativa</span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      Julio 2026
                    </span>
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
