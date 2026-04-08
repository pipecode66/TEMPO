"use client";

import { useDeferredValue, useEffect, useState, type FormEvent } from "react";
import { KeyRound, Search, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";

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
        text: "Selecciona un empleado y define una contraseña temporal.",
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Colaboradores registrados</CardDescription>
            <CardTitle className="text-3xl font-display">{employees.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Activos hoy</CardDescription>
            <CardTitle className="text-3xl font-display">
              {activeEmployees.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Menores protegidos</CardDescription>
            <CardTitle className="text-3xl font-display">{minors.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="space-y-1">
            <CardDescription>Jornada promedio</CardDescription>
            <CardTitle className="text-3xl font-display">
              {formatHours(averageWeeklyHours)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-card/80">
          <CardHeader className="border-b border-border/80">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Directorio de empleados</CardTitle>
                <CardDescription>
                  Busca, filtra y actualiza el estado operativo del equipo centralizado.
                </CardDescription>
              </div>
              {!permissions.canManageEmployees ? (
                <Badge variant="outline">Modo consulta</Badge>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre, email, area o jurisdiccion"
                    className="pl-9"
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
            {filteredEmployees.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-background/50 px-6 py-12 text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-base font-medium text-foreground">
                  No hay empleados para mostrar
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ajusta los filtros o crea el primer empleado desde el formulario lateral.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Rol</TableHead>
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
                        <div>
                          <p className="font-medium text-foreground">{employee.nombre}</p>
                          <p className="text-xs text-muted-foreground">{employee.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-foreground">{employee.cargo}</p>
                          <p className="text-xs text-muted-foreground">{employee.area}</p>
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
                          >
                            {employee.portalAccessEnabled ? "Portal activo" : "Sin portal"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(employee.salarioBase)}</TableCell>
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
                          <SelectTrigger className="w-32">
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
                          variant="ghost"
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
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Nuevo empleado</CardTitle>
              <CardDescription>
                Guarda la ficha base del colaborador y asígnale la regla normativa correcta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    value={formState.nombre}
                    onChange={(event) => updateField("nombre", event.target.value)}
                    placeholder="Nombre completo"
                    disabled={!permissions.canManageEmployees}
                  />
                  <Input
                    type="email"
                    value={formState.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="correo@empresa.com"
                    disabled={!permissions.canManageEmployees}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    value={formState.cargo}
                    onChange={(event) => updateField("cargo", event.target.value)}
                    placeholder="Cargo"
                    disabled={!permissions.canManageEmployees}
                  />
                  <Input
                    value={formState.area}
                    onChange={(event) => updateField("area", event.target.value)}
                    placeholder="Area"
                    disabled={!permissions.canManageEmployees}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    type="number"
                    min="15"
                    value={formState.edad}
                    onChange={(event) => updateField("edad", event.target.value)}
                    placeholder="Edad"
                    disabled={!permissions.canManageEmployees}
                  />
                  <Input
                    type="number"
                    min="1"
                    value={formState.salarioBase}
                    onChange={(event) => updateField("salarioBase", event.target.value)}
                    placeholder="Salario base COP"
                    disabled={!permissions.canManageEmployees}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
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
                  <Input
                    type="number"
                    min="1"
                    max="48"
                    value={formState.jornadaSemanalHoras}
                    onChange={(event) =>
                      updateField("jornadaSemanalHoras", event.target.value)
                    }
                    placeholder="Horas/semana"
                    disabled={!permissions.canManageEmployees}
                  />
                  <Select
                    value={formState.diasLaboralesSemana}
                    onValueChange={(value) => updateField("diasLaboralesSemana", value)}
                    disabled={!permissions.canManageEmployees}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Dias/semana" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 dias</SelectItem>
                      <SelectItem value="6">6 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

                {feedback ? (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      feedback.type === "success"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {feedback.text}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!permissions.canManageEmployees || isSubmitting}
                >
                  <UserPlus className="h-4 w-4" />
                  {isSubmitting ? "Guardando..." : "Guardar empleado"}
                </Button>

                <div className="rounded-2xl bg-background/60 p-4">
                  <p className="text-sm font-medium text-foreground">Contexto actual</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Jornada maxima legal configurada: {policySettings.jornadaSemanalMaxima}h
                    semanales en {policySettings.diasLaboralesSemana} dias.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Jurisdiccion base: {policySettings.jurisdictionCode}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Masa salarial registrada: {formatCurrency(
                      employees.reduce((total, employee) => total + employee.salarioBase, 0),
                    )}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Usa este formulario para poblar la operación con datos reales.
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

          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Portal del empleado</CardTitle>
              <CardDescription>
                Habilita autoservicio con contraseña temporal para marcación e historial propio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProvisionPortal} className="space-y-4">
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

                <Input
                  type="password"
                  value={portalSetup.password}
                  onChange={(event) =>
                    setPortalSetup((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Contraseña temporal"
                  disabled={!permissions.canManageEmployees}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!permissions.canManageEmployees || isProvisioningPortal}
                >
                  <KeyRound className="h-4 w-4" />
                  {isProvisioningPortal ? "Habilitando..." : "Habilitar portal"}
                </Button>

                <div className="rounded-2xl bg-background/60 p-4">
                  <p className="text-sm font-medium text-foreground">Qué habilita</p>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Inicio y fin de jornada con geolocalización
                    </p>
                    <p className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Uso de QR cuando la empresa lo exige
                    </p>
                    <p className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Historial propio y acumulado mensual de extras
                    </p>
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
