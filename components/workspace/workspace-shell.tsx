"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Clock3,
  LogOut,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getWorkspaceModule, workspaceNavigation } from "@/lib/tempo-navigation";
import { useTempoWorkspace } from "@/components/workspace/tempo-provider";

function WorkspaceLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all",
        active
          ? "border-black/6 bg-white text-foreground shadow-[0_16px_45px_-28px_rgba(15,23,42,0.35)]"
          : "border-transparent text-muted-foreground hover:border-black/5 hover:bg-white/75 hover:text-foreground",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-2xl transition-colors",
          active ? "bg-secondary text-foreground" : "bg-transparent text-muted-foreground group-hover:bg-secondary group-hover:text-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="font-medium">{label}</span>
      <ChevronRight
        className={cn(
          "ml-auto h-4 w-4 transition-transform",
          active ? "translate-x-0 text-foreground" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
        )}
      />
    </Link>
  );
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const moduleMeta = getWorkspaceModule(pathname);
  const { employees, timeEntries, companyProfile, hydrated, isSyncing } =
    useTempoWorkspace();
  const { isLoading: isAuthLoading, logout, permissions, user } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/");
      return;
    }
    if (user?.role === "consulta") {
      router.replace("/portal");
    }
  }, [isAuthLoading, router, user, user?.role]);

  const alertCount = timeEntries.filter(
    (entry) => entry.response.alerta_limite_legal,
  ).length;
  const readinessCount = [
    companyProfile.nombreLegal.length > 0,
    employees.length > 0,
    timeEntries.length > 0,
  ].filter(Boolean).length;

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.14),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(226,232,240,0.8),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,0.82),_rgba(245,247,250,0.96))]" />

      <aside className="fixed inset-y-4 left-4 hidden w-[18.75rem] overflow-hidden rounded-[2rem] border border-black/6 bg-white/82 px-5 py-6 shadow-[0_32px_90px_-40px_rgba(15,23,42,0.3)] backdrop-blur-xl lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.16),_transparent_72%)]" />

        <Link href="/dashboard" className="relative flex items-center gap-3 px-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.3rem] bg-primary text-primary-foreground shadow-[0_20px_30px_-20px_rgba(15,23,42,0.5)]">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-[2rem] leading-none text-foreground">Tempo</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.34em] text-muted-foreground">
              operations suite
            </p>
          </div>
        </Link>

        <div className="relative mt-8 rounded-[1.75rem] border border-black/6 bg-white/88 p-5 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles className="h-4 w-4" />
            Estado del entorno
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">{employees.length} empleados</Badge>
            <Badge variant="secondary">{timeEntries.length} jornadas</Badge>
            <Badge variant={alertCount > 0 ? "destructive" : "secondary"}>
              {alertCount} alertas
            </Badge>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Activa {readinessCount} de 3 frentes clave: empresa, personal y control
            de jornadas.
          </p>
        </div>

        <nav className="mt-8 flex-1 space-y-2">
          {workspaceNavigation.map((item) => (
            <WorkspaceLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href}
            />
          ))}
        </nav>

        <Separator className="my-5 bg-black/6" />

        <div className="rounded-[1.75rem] border border-black/6 bg-white/88 p-5 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.35)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {user?.email ?? "Sin sesion activa"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {user ? `Rol ${user.role}` : "Acceso del sistema"}
              </p>
            </div>
            <ShieldCheck className="mt-0.5 h-4 w-4 text-foreground" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {permissions.canManageTimeEntries ? (
              <Badge variant="secondary">Operacion</Badge>
            ) : (
              <Badge variant="outline">Solo lectura</Badge>
            )}
            {permissions.canViewAudit ? (
              <Badge variant="secondary">Auditoria</Badge>
            ) : null}
          </div>
          <Button
            variant="ghost"
            className="mt-4 w-full justify-start rounded-2xl border border-black/6 bg-secondary/70 px-4 py-6"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </Button>
        </div>
      </aside>

      <div className="relative lg:ml-[21rem]">
        <header className="sticky top-0 z-40 px-5 pt-4 lg:px-8">
          <div className="rounded-[2rem] border border-black/6 bg-white/82 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.3)] backdrop-blur-xl">
            <div className="flex flex-col gap-5 px-5 py-5 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 lg:hidden">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <span className="font-display text-xl text-foreground">Tempo</span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  {moduleMeta.label}
                </p>
                <h1 className="mt-3 font-display text-5xl leading-none text-foreground">
                  {moduleMeta.label}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                  {moduleMeta.description}
                </p>
                {!hydrated || isSyncing ? (
                  <p className="mt-4 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Sincronizando datos centralizados...
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 rounded-2xl border border-black/6 bg-secondary/65 px-4 py-3 text-sm text-muted-foreground">
                  <Bell className="h-4 w-4" />
                  {alertCount > 0 ? `${alertCount} alertas legales activas` : "Sin alertas activas"}
                </div>
                {permissions.canManageEmployees ? (
                  <Button asChild variant="outline">
                    <Link href="/empleados">Nuevo empleado</Link>
                  </Button>
                ) : null}
                {permissions.canManageTimeEntries ? (
                  <Button asChild>
                    <Link href="/control-tiempo">Registrar jornada</Link>
                  </Button>
                ) : permissions.canApproveAttendance ? (
                  <Button asChild>
                    <Link href="/aprobaciones">Revisar aprobaciones</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/reportes">Ver reportes</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {workspaceNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors",
                    pathname === item.href
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-black/6 bg-white/85 text-muted-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          </div>
        </header>

        <main className="px-5 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
