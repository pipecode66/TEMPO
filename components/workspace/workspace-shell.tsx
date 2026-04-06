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
import type { ReactNode } from "react";

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
        "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all",
        active
          ? "bg-secondary text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
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
  const { logout, permissions, user } = useAuth();

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
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.05),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.03),_transparent_18%)]" />

      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-background/95 px-5 py-6 backdrop-blur lg:flex lg:flex-col">
        <Link href="/dashboard" className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
            <Clock3 className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="font-display text-2xl text-foreground">Tempo</p>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              workspace
            </p>
          </div>
        </Link>

        <div className="mt-8 rounded-3xl border border-border bg-card/70 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
          <p className="mt-4 text-sm text-muted-foreground">
            Activa {readinessCount} de 3 frentes clave: empresa, personal y control
            de jornadas.
          </p>
        </div>

        <nav className="mt-8 flex-1 space-y-1">
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

        <Separator className="my-5" />

        <div className="rounded-3xl border border-border bg-card/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
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
          <Button variant="ghost" className="mt-4 w-full justify-start px-0" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </Button>
        </div>
      </aside>

      <div className="relative lg:ml-72">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="flex flex-col gap-5 px-5 py-5 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 lg:hidden">
                  <Clock3 className="h-5 w-5 text-foreground" />
                  <span className="font-display text-xl text-foreground">Tempo</span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  {moduleMeta.label}
                </p>
                <h1 className="mt-3 font-display text-4xl leading-none text-foreground">
                  {moduleMeta.label}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {moduleMeta.description}
                </p>
                {!hydrated || isSyncing ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Sincronizando datos centralizados...
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
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
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <main className="px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
