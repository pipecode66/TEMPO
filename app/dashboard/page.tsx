"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  ChevronDown,
  Building2,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Moon,
  Sun
} from "lucide-react";
import Link from "next/link";

// Datos de demostración
const statsData = [
  { 
    label: "Empleados Activos", 
    value: "247", 
    change: "+12", 
    changeType: "positive" as const,
    icon: Users 
  },
  { 
    label: "Horas Registradas Hoy", 
    value: "1,892", 
    change: "+156", 
    changeType: "positive" as const,
    icon: Clock 
  },
  { 
    label: "Horas Extras (Semana)", 
    value: "324", 
    change: "-8%", 
    changeType: "negative" as const,
    icon: TrendingUp 
  },
  { 
    label: "Alertas Activas", 
    value: "3", 
    change: "Revisar", 
    changeType: "warning" as const,
    icon: AlertTriangle 
  },
];

const recentActivity = [
  { name: "María García", action: "Entrada registrada", time: "08:02", department: "Contabilidad", status: "on-time" },
  { name: "Carlos Rodríguez", action: "Salida registrada", time: "18:15", department: "IT", status: "overtime" },
  { name: "Ana Martínez", action: "Solicitud de permiso", time: "09:30", department: "RRHH", status: "pending" },
  { name: "Juan Pérez", action: "Entrada registrada", time: "08:45", department: "Ventas", status: "late" },
  { name: "Laura Sánchez", action: "Horas extras aprobadas", time: "17:00", department: "Producción", status: "approved" },
];

const quickAlerts = [
  { type: "warning", message: "3 empleados excedieron el límite de horas extras semanales" },
  { type: "info", message: "Próximo festivo: 20 de julio - Día de la Independencia" },
  { type: "success", message: "Nómina de junio cerrada correctamente" },
];

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar reloj
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border hidden lg:flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-7 h-7 text-foreground" />
            <span className="font-display text-xl tracking-tight text-foreground">Tempo</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary text-foreground">
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
                <Users className="w-5 h-5" />
                <span className="text-sm">Empleados</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
                <Clock className="w-5 h-5" />
                <span className="text-sm">Control de tiempos</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
                <Calendar className="w-5 h-5" />
                <span className="text-sm">Calendario</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
                <FileText className="w-5 h-5" />
                <span className="text-sm">Reportes</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
                <Building2 className="w-5 h-5" />
                <span className="text-sm">Empresa</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
                <Settings className="w-5 h-5" />
                <span className="text-sm">Configuración</span>
              </a>
            </li>
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-sm font-medium text-foreground">CR</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Carlos Rodríguez</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
            <Link href="/login">
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-6 lg:px-8 h-16">
            {/* Mobile menu & Search */}
            <div className="flex items-center gap-4">
              <div className="lg:hidden flex items-center gap-2">
                <Clock className="w-6 h-6 text-foreground" />
                <span className="font-display text-lg text-foreground">Tempo</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar empleados, reportes..."
                  className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-64"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Current time */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-mono text-foreground">
                  {currentTime.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {currentTime.getHours() >= 21 || currentTime.getHours() < 6 ? (
                  <Moon className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <Sun className="w-3 h-3 text-muted-foreground" />
                )}
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* Profile dropdown */}
              <button className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-card transition-colors">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-xs font-medium text-foreground">CR</span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 lg:p-8">
          {/* Welcome section */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-display text-foreground">
              Buenos días, Carlos
            </h1>
            <p className="mt-1 text-muted-foreground">
              Aquí está el resumen de hoy, {currentTime.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statsData.map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-xl bg-card border border-border hover:border-foreground/20 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-secondary">
                    <stat.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stat.changeType === "positive"
                        ? "bg-green-500/10 text-green-500"
                        : stat.changeType === "negative"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-display text-foreground">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 rounded-xl bg-card border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-foreground">Actividad Reciente</h2>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Ver todo
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-border">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-xs font-medium text-foreground">
                          {activity.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{activity.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.action} • {activity.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
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
                      <span className="text-sm text-muted-foreground font-mono">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts & Quick Info */}
            <div className="space-y-6">
              {/* Alerts */}
              <div className="rounded-xl bg-card border border-border">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-medium text-foreground">Alertas del Sistema</h2>
                </div>
                <div className="p-4 space-y-3">
                  {quickAlerts.map((alert, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        alert.type === "warning"
                          ? "bg-yellow-500/10"
                          : alert.type === "success"
                          ? "bg-green-500/10"
                          : "bg-secondary"
                      }`}
                    >
                      {alert.type === "warning" ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                      ) : alert.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <Bell className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm text-foreground">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Jornada Info */}
              <div className="rounded-xl bg-card border border-border p-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  Configuración Actual
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Jornada Máxima</span>
                    <span className="text-sm font-medium text-foreground">42h/semana</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Horario Nocturno</span>
                    <span className="text-sm font-medium text-foreground">21:00 - 06:00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Extras Máximas</span>
                    <span className="text-sm font-medium text-foreground">12h/semana</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ley Vigente</span>
                    <span className="text-sm font-medium text-foreground">Ley 2101</span>
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
