"use client";

import { useDeferredValue, useState, type FormEvent } from "react";
import { Search, Trash2, UserPlus, Users } from "lucide-react";

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
import { formatCurrency, formatHours } from "@/lib/tempo-format";
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
};

export function EmployeesModule() {
  const {
    employees,
    addEmployee,
    policySettings,
    removeEmployee,
    updateEmployeeStatus,
  } = useTempoWorkspace();
  const [formState, setFormState] = useState({
    ...defaultFormState,
    jornadaSemanalHoras: String(policySettings.jornadaSemanalMaxima),
    diasLaboralesSemana: String(policySettings.diasLaboralesSemana),
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | EmployeeStatus>("todos");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(
    null,
  );

  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      normalizedSearch.length === 0
        ? true
        : [employee.nombre, employee.email, employee.cargo, employee.area]
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

  function updateField(field: keyof typeof formState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
    };

    addEmployee(payload);
    setFormState({
      ...defaultFormState,
      jornadaSemanalHoras: String(policySettings.jornadaSemanalMaxima),
      diasLaboralesSemana: String(policySettings.diasLaboralesSemana),
    });
    setFeedback({
      type: "success",
      text: `${payload.nombre} fue agregado al directorio operativo.`,
    });
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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="bg-card/80">
          <CardHeader className="border-b border-border/80">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Directorio de empleados</CardTitle>
                <CardDescription>
                  Busca, filtra y actualiza el estado operativo del equipo.
                </CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre, email o area"
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
                      <TableCell>{formatCurrency(employee.salarioBase)}</TableCell>
                      <TableCell>
                        <Select
                          value={employee.estado}
                          onValueChange={(value) =>
                            updateEmployeeStatus(employee.id, value as EmployeeStatus)
                          }
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
                          onClick={() => removeEmployee(employee.id)}
                          aria-label={`Eliminar a ${employee.nombre}`}
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

        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Nuevo empleado</CardTitle>
            <CardDescription>
              Guarda la ficha basica del colaborador para operar dentro de Tempo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  value={formState.nombre}
                  onChange={(event) => updateField("nombre", event.target.value)}
                  placeholder="Nombre completo"
                />
                <Input
                  type="email"
                  value={formState.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="correo@empresa.com"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  value={formState.cargo}
                  onChange={(event) => updateField("cargo", event.target.value)}
                  placeholder="Cargo"
                />
                <Input
                  value={formState.area}
                  onChange={(event) => updateField("area", event.target.value)}
                  placeholder="Area"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  type="number"
                  min="15"
                  value={formState.edad}
                  onChange={(event) => updateField("edad", event.target.value)}
                  placeholder="Edad"
                />
                <Input
                  type="number"
                  min="1"
                  value={formState.salarioBase}
                  onChange={(event) => updateField("salarioBase", event.target.value)}
                  placeholder="Salario base COP"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  type="number"
                  min="1"
                  max="48"
                  value={formState.jornadaSemanalHoras}
                  onChange={(event) =>
                    updateField("jornadaSemanalHoras", event.target.value)
                  }
                  placeholder="Horas/semana"
                />
                <Select
                  value={formState.diasLaboralesSemana}
                  onValueChange={(value) => updateField("diasLaboralesSemana", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Dias/semana" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 dias</SelectItem>
                    <SelectItem value="6">6 dias</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={formState.estado}
                  onValueChange={(value) => updateField("estado", value)}
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

              <Button type="submit" className="w-full">
                <UserPlus className="h-4 w-4" />
                Guardar empleado
              </Button>

              <div className="rounded-2xl bg-background/60 p-4">
                <p className="text-sm font-medium text-foreground">Contexto actual</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Jornada maxima legal configurada: {policySettings.jornadaSemanalMaxima}h
                  semanales en {policySettings.diasLaboralesSemana} dias.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Masa salarial registrada: {formatCurrency(
                    employees.reduce((total, employee) => total + employee.salarioBase, 0),
                  )}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Usa este formulario para empezar a poblar la operacion con datos reales.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
