"use client";

import { useDeferredValue, useEffect, useState, type FormEvent } from "react";
import {
  BriefcaseBusiness,
  Clock3,
  Globe2,
  KeyRound,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/fetch-json";
import { formatCurrency, formatHours } from "@/lib/tempo-format";
import { listJurisdictions, type JurisdictionOption } from "@/lib/tempo-api";
import { cn } from "@/lib/utils";
import {
  type EmployeeDraft,
  type EmployeeStatus,
  useTempoWorkspace,
} from "@/components/workspace/tempo-provider";

const defaultFormState = {
  nombre: "",
  email: "",
  cargo: "",
  area: "",
  edad: "",
  salarioBase: "",
  jornadaSemanalHoras: "42",
  diasLaboralesSemana: "5",
  estado: "activo",
  jurisdictionCode: "co-national-2026",
};

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  className,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  note: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-black/6 bg-white/82 p-5 shadow-[0_20px_45px_-34px_rgba(15,23,42,0.35)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {label}
          </p>
          <p className="text-4xl font-display leading-none text-foreground">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-secondary text-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{note}</p>
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
      {children}
    </label>
  );
}

export function EmployeesModule() {
  const {
    employees,
    addEmployee,
    policySettings,
    provisionEmployeePortalAccess,
    removeEmployee,
    updateEmployeeStatus,
    isSyncing,
  } = useTempoWorkspace();
  const { permissions } = useAuth();
  const [jurisdictions, setJurisdictions] = useState<JurisdictionOption[]>([]);
  const [formState, setFormState] = useState({
    ...defaultFormState,
    jornadaSemanalHoras: String(policySettings.jornadaSemanalMaxima),
    diasLaboralesSemana: String(policySettings.diasLaboralesSemana),
    jurisdictionCode: policySettings.jurisdictionCode,
  });
  const [portalSetup, setPortalSetup] = useState({
    employeeId: "",
    password: "",
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | EmployeeStatus>("todos");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProvisioningPortal, setIsProvisioningPortal] = useState(false);

  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      normalizedSearch.length === 0
        ? true
        : [
            employee.nombre,
            employee.email,
            employee.cargo,
            employee.area,
            employee.jurisdictionCode,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);

    const matchesStatus =
      statusFilter === "todos" ? true : employee.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const minors = employees.filter((employee) => employee.edad <= 17);
  const activeEmployees = employees.filter((employee) => employee.estado === "activo");
  const portalReadyEmployees = employees.filter((employee) => employee.portalAccessEnabled);
  const totalPayroll = employees.reduce(
    (total, employee) => total + employee.salarioBase,
    0,
  );
  const averageWeeklyHours =
    employees.length === 0
      ? 0
      : employees.reduce((total, employee) => total + employee.jornadaSemanalHoras, 0) /
        employees.length;

  useEffect(() => {
    async function loadJurisdictions() {
      try {
        const items = await listJurisdictions();
        setJurisdictions(items);
      } catch (error) {
        setFeedback({
          type: "error",
          text: getApiErrorMessage(error),
        });
      }
    }

    void loadJurisdictions();
  }, []);

  function updateField(field: keyof typeof formState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!permissions.canManageEmployees) {
      setFeedback({
        type: "error",
        text: "Tu rol solo tiene acceso de consulta sobre empleados.",
      });
      return;
    }

    if (!formState.nombre || !formState.email || !formState.cargo || !formState.area) {
      setFeedback({
        type: "error",
        text: "Completa nombre, email, cargo y area antes de guardar.",
      });
      return;
    }

    const edad = Number(formState.edad);
    const salarioBase = Number(formState.salarioBase);
    const jornadaSemanalHoras = Number(formState.jornadaSemanalHoras);

    if (!Number.isFinite(edad) || edad < 15) {
      setFeedback({
        type: "error",
        text: "La edad debe ser igual o superior a 15 anos.",
      });
      return;
    }

    if (!Number.isFinite(salarioBase) || salarioBase <= 0) {
      setFeedback({
        type: "error",
        text: "Ingresa un salario base valido en COP.",
      });
      return;
    }

    if (!Number.isFinite(jornadaSemanalHoras) || jornadaSemanalHoras <= 0) {
      setFeedback({
        type: "error",
        text: "La jornada semanal debe ser un numero positivo.",
      });
      return;
    }

    const payload: EmployeeDraft = {
      nombre: formState.nombre,
      email: formState.email,
      cargo: formState.cargo,
      area: formState.area,
      edad,
      salarioBase,
      jornadaSemanalHoras,
      diasLaboralesSemana: Number(formState.diasLaboralesSemana) as 5 | 6,
      estado: formState.estado as EmployeeStatus,
      jurisdictionCode: formState.jurisdictionCode,
    };

    try {
      setIsSubmitting(true);
      await addEmployee(payload);
      setFormState({
        ...defaultFormState,
        jornadaSemanalHoras: String(policySettings.jornadaSemanalMaxima),
        diasLaboralesSemana: String(policySettings.diasLaboralesSemana),
        jurisdictionCode: policySettings.jurisdictionCode,
      });
      setFeedback({
        type: "success",
        text: `${payload.nombre} fue agregado al directorio operativo.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No fue posible guardar el empleado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProvisionPortal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!permissions.canManageEmployees) {
      setFeedback({
        type: "error",
        text: "Tu rol no puede habilitar autoservicio de empleados.",
      });
      return;
    }
    if (!portalSetup.employeeId || !portalSetup.password.trim()) {
      setFeedback({
        type: "error",
        text: "Selecciona un empleado y define una contrasena temporal.",
      });
      return;
    }

    try {
      setIsProvisioningPortal(true);
      await provisionEmployeePortalAccess(portalSetup.employeeId, {
        password: portalSetup.password,
      });
      setPortalSetup({ employeeId: "", password: "" });
      setFeedback({
        type: "success",
        text: "Portal del empleado habilitado correctamente.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error),
      });
    } finally {
      setIsProvisioningPortal(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="relative overflow-hidden border-black/6 bg-white/92">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_66%),linear-gradient(180deg,_rgba(248,250,252,0.95),_rgba(255,255,255,0))]" />
          <CardHeader className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-accent/80 text-accent-foreground">
                Centro de personal
              </Badge>
              <Badge variant="outline">{filteredEmployees.length} visibles</Badge>
            </div>
            <CardTitle className="font-display text-5xl leading-[0.92] text-foreground">
              Gestiona tu equipo con una vista clara y lista para operar.
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              Alta de personal, seguimiento de jurisdicciones y activacion de portal
              del empleado desde una sola superficie de trabajo.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative grid gap-4 md:grid-cols-3">
            <MetricCard
              icon={Users}
              label="Colaboradores"
              value={String(employees.length)}
              note="Directorio maestro centralizado para operacion, reportes y control."
              className="bg-white/92"
            />
            <MetricCard
              icon={BriefcaseBusiness}
              label="Activos hoy"
              value={String(activeEmployees.length)}
              note="Personal disponible con estado operativo listo para jornadas y aprobaciones."
            />
            <MetricCard
              icon={Clock3}
              label="Jornada promedio"
              value={formatHours(averageWeeklyHours)}
              note="Promedio actual segun horas semanales pactadas en la plantilla."
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard
            icon={ShieldCheck}
            label="Portal activo"
            value={String(portalReadyEmployees.length)}
            note="Empleados con acceso listo para autoservicio, historial y marcacion."
          />
          <MetricCard
            icon={Globe2}
            label="Menores protegidos"
            value={String(minors.length)}
            note="Seguimiento rapido para aplicar reglas reforzadas por edad."
          />
          <Card className="border-black/6 bg-white/92">
            <CardHeader className="space-y-3">
              <Badge variant="outline">Contexto financiero</Badge>
              <CardTitle className="text-2xl font-display">Masa salarial visible</CardTitle>
              <CardDescription className="leading-7">
                Mantiene a nomina y supervisores alineados con el peso actual del equipo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.5rem] border border-black/6 bg-secondary/70 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Salario base acumulado
                </p>
                <p className="mt-3 text-3xl font-display text-foreground">
                  {formatCurrency(totalPayroll)}
                </p>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                {isSyncing
                  ? "Sincronizando directorio y fichas activas..."
                  : "Vista sincronizada y lista para altas, cambios de estado y portal."}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {feedback ? (
        <div
          className={cn(
            "rounded-[1.5rem] border px-5 py-4 text-sm shadow-[0_18px_40px_-30px_rgba(15,23,42,0.28)]",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {feedback.text}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="overflow-hidden border-black/6 bg-white/92">
          <CardHeader className="border-b border-black/6 bg-[linear-gradient(180deg,_rgba(248,250,252,0.9),_rgba(255,255,255,0.95))]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Badge variant="outline">Directorio</Badge>
                <div>
                  <CardTitle className="text-3xl font-display">Equipo centralizado</CardTitle>
                  <CardDescription className="mt-2 max-w-xl leading-7">
                    Busca, filtra y actualiza el estado operativo del personal sin
                    perder contexto de salario, jurisdiccion o acceso al portal.
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:w-80">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre, email, area o jurisdiccion"
                    className="pl-11"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as "todos" | EmployeeStatus)
                  }
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="activo">Activos</SelectItem>
                    <SelectItem value="licencia">Licencia</SelectItem>
                    <SelectItem value="retirado">Retirados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {!permissions.canManageEmployees ? (
              <div className="mb-4">
                <Badge variant="outline">Modo consulta</Badge>
              </div>
            ) : null}
            {filteredEmployees.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-black/10 bg-secondary/55 px-6 py-16 text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-lg font-semibold text-foreground">
                  No hay empleados para mostrar
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Ajusta los filtros o crea el primer empleado desde el panel lateral.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[1.6rem] border border-black/6 bg-[linear-gradient(180deg,_rgba(248,250,252,0.88),_rgba(255,255,255,0.96))]">
                <Table className="[&_th:first-child]:pl-6 [&_th:last-child]:pr-6 [&_td:first-child]:pl-6 [&_td:last-child]:pr-6">
                  <TableHeader>
                    <TableRow className="border-black/6 bg-transparent hover:bg-transparent">
                      <TableHead>Empleado</TableHead>
                      <TableHead>Rol y area</TableHead>
                      <TableHead>Condicion</TableHead>
                      <TableHead>Jurisdiccion</TableHead>
                      <TableHead>Salario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-foreground">
                              {employee.nombre}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {employee.email || "Sin correo asociado"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">{employee.cargo}</p>
                            <p className="text-sm text-muted-foreground">{employee.area}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              {employee.edad <= 17 ? "Menor protegido" : "Mayor de edad"}
                            </Badge>
                            <Badge variant="outline">
                              {employee.diasLaboralesSemana} dias / {employee.jornadaSemanalHoras}h
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Badge variant="outline">{employee.jurisdictionCode}</Badge>
                            <Badge
                              variant={employee.portalAccessEnabled ? "secondary" : "outline"}
                              className={
                                employee.portalAccessEnabled
                                  ? "bg-emerald-50 text-emerald-700"
                                  : undefined
                              }
                            >
                              {employee.portalAccessEnabled ? "Portal activo" : "Sin portal"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-base font-semibold text-foreground">
                          {formatCurrency(employee.salarioBase)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={employee.estado}
                            onValueChange={async (value) => {
                              try {
                                setFeedback(null);
                                await updateEmployeeStatus(employee.id, value as EmployeeStatus);
                              } catch (error) {
                                setFeedback({
                                  type: "error",
                                  text:
                                    error instanceof Error
                                      ? error.message
                                      : "No fue posible actualizar el estado.",
                                });
                              }
                            }}
                            disabled={!permissions.canManageEmployees}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="activo">Activo</SelectItem>
                              <SelectItem value="licencia">Licencia</SelectItem>
                              <SelectItem value="retirado">Retirado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={async () => {
                              try {
                                setFeedback(null);
                                await removeEmployee(employee.id);
                              } catch (error) {
                                setFeedback({
                                  type: "error",
                                  text:
                                    error instanceof Error
                                      ? error.message
                                      : "No fue posible eliminar el empleado.",
                                });
                              }
                            }}
                            aria-label={`Eliminar a ${employee.nombre}`}
                            disabled={!permissions.canManageEmployees}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-black/6 bg-white/92">
            <CardHeader>
              <Badge variant="outline">Alta manual</Badge>
              <CardTitle className="text-3xl font-display">Nuevo empleado</CardTitle>
              <CardDescription className="leading-7">
                Guarda la ficha base del colaborador, define su regla normativa y
                deja listo su marco operativo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel>Nombre completo</FieldLabel>
                    <Input
                      value={formState.nombre}
                      onChange={(event) => updateField("nombre", event.target.value)}
                      placeholder="Nombre del colaborador"
                      disabled={!permissions.canManageEmployees}
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Correo</FieldLabel>
                    <Input
                      type="email"
                      value={formState.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="correo@empresa.com"
                      disabled={!permissions.canManageEmployees}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel>Cargo</FieldLabel>
                    <Input
                      value={formState.cargo}
                      onChange={(event) => updateField("cargo", event.target.value)}
                      placeholder="Cargo principal"
                      disabled={!permissions.canManageEmployees}
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Area</FieldLabel>
                    <Input
                      value={formState.area}
                      onChange={(event) => updateField("area", event.target.value)}
                      placeholder="Area operativa"
                      disabled={!permissions.canManageEmployees}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel>Edad</FieldLabel>
                    <Input
                      type="number"
                      min="15"
                      value={formState.edad}
                      onChange={(event) => updateField("edad", event.target.value)}
                      placeholder="Edad"
                      disabled={!permissions.canManageEmployees}
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Salario base COP</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      value={formState.salarioBase}
                      onChange={(event) => updateField("salarioBase", event.target.value)}
                      placeholder="Salario mensual"
                      disabled={!permissions.canManageEmployees}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2 sm:col-span-3">
                    <FieldLabel>Jurisdiccion</FieldLabel>
                    <Select
                      value={formState.jurisdictionCode}
                      onValueChange={(value) => updateField("jurisdictionCode", value)}
                      disabled={!permissions.canManageEmployees}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Jurisdiccion" />
                      </SelectTrigger>
                      <SelectContent>
                        {jurisdictions.map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Horas por semana</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      max="48"
                      value={formState.jornadaSemanalHoras}
                      onChange={(event) =>
                        updateField("jornadaSemanalHoras", event.target.value)
                      }
                      placeholder="Horas"
                      disabled={!permissions.canManageEmployees}
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Dias por semana</FieldLabel>
                    <Select
                      value={formState.diasLaboralesSemana}
                      onValueChange={(value) => updateField("diasLaboralesSemana", value)}
                      disabled={!permissions.canManageEmployees}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Dias por semana" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 dias</SelectItem>
                        <SelectItem value="6">6 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Estado</FieldLabel>
                    <Select
                      value={formState.estado}
                      onValueChange={(value) => updateField("estado", value)}
                      disabled={!permissions.canManageEmployees}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="licencia">Licencia</SelectItem>
                        <SelectItem value="retirado">Retirado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full"
                  disabled={!permissions.canManageEmployees || isSubmitting}
                >
                  <UserPlus className="h-4 w-4" />
                  {isSubmitting ? "Guardando..." : "Guardar empleado"}
                </Button>

                <div className="rounded-[1.5rem] border border-black/6 bg-secondary/65 p-5">
                  <p className="text-sm font-semibold text-foreground">Contexto actual</p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Jornada maxima legal configurada: {policySettings.jornadaSemanalMaxima}h
                    semanales en {policySettings.diasLaboralesSemana} dias.
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Jurisdiccion base: {policySettings.jurisdictionCode}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Masa salarial registrada: {formatCurrency(totalPayroll)}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Usa este formulario para poblar la operacion con datos reales.
                  </p>
                  {isSyncing ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Sincronizando directorio...
                    </p>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-black/6 bg-white/92">
            <CardHeader>
              <Badge variant="outline">Autoservicio</Badge>
              <CardTitle className="text-3xl font-display">Portal del empleado</CardTitle>
              <CardDescription className="leading-7">
                Habilita acceso con contrasena temporal para marcacion, historial y
                seguimiento de extras.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProvisionPortal} className="space-y-5">
                <div className="space-y-2">
                  <FieldLabel>Empleado</FieldLabel>
                  <Select
                    value={portalSetup.employeeId}
                    onValueChange={(value) =>
                      setPortalSetup((current) => ({ ...current, employeeId: value }))
                    }
                    disabled={!permissions.canManageEmployees}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona empleado para portal" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter((employee) => employee.email)
                        .map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <FieldLabel>Contrasena temporal</FieldLabel>
                  <Input
                    type="password"
                    value={portalSetup.password}
                    onChange={(event) =>
                      setPortalSetup((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Define una contrasena inicial"
                    disabled={!permissions.canManageEmployees}
                  />
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full"
                  disabled={!permissions.canManageEmployees || isProvisioningPortal}
                >
                  <KeyRound className="h-4 w-4" />
                  {isProvisioningPortal ? "Habilitando..." : "Habilitar portal"}
                </Button>

                <div className="rounded-[1.5rem] border border-black/6 bg-secondary/65 p-5">
                  <p className="text-sm font-semibold text-foreground">Que habilita</p>
                  <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2 leading-6">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-foreground" />
                      Inicio y fin de jornada con geolocalizacion.
                    </p>
                    <p className="flex items-start gap-2 leading-6">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-foreground" />
                      Uso de QR cuando la empresa lo exige.
                    </p>
                    <p className="flex items-start gap-2 leading-6">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-foreground" />
                      Historial propio y acumulado mensual de extras.
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-dashed border-black/8 bg-white/70 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-secondary text-foreground">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Accesos listos hoy
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {portalReadyEmployees.length} empleado(s) ya tienen portal activo
                        y pueden marcar jornada desde su propio flujo.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
