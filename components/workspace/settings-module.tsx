"use client";

import { useEffect, useState, type FormEvent } from "react";

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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTempoWorkspace } from "@/components/workspace/tempo-provider";

const defaultLegalSettings = {
  jornadaSemanalMaxima: 42,
  diasLaboralesSemana: 5 as 5 | 6,
  limiteExtrasDiarias: 2,
  limiteExtrasSemanales: 12,
  horarioNocturnoInicio: "19:00",
  horarioNocturnoFin: "06:00",
  alertasAutomaticas: true,
  cierreSemanalAutomatico: false,
  recargoDescansoObligatorio: 0.9,
  fechaNormativa: "2026-07-15",
};

export function SettingsModule() {
  const { policySettings, savePolicySettings, resetWorkspace } = useTempoWorkspace();
  const [formState, setFormState] = useState(policySettings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setFormState(policySettings);
  }, [policySettings]);

  function updateField(field: keyof typeof formState, value: string | boolean) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    savePolicySettings({
      ...formState,
      jornadaSemanalMaxima: Number(formState.jornadaSemanalMaxima),
      diasLaboralesSemana: Number(formState.diasLaboralesSemana) as 5 | 6,
      limiteExtrasDiarias: Number(formState.limiteExtrasDiarias),
      limiteExtrasSemanales: Number(formState.limiteExtrasSemanales),
      recargoDescansoObligatorio: Number(formState.recargoDescansoObligatorio),
    });
    setMessage("Configuracion actualizada.");
  }

  function restoreDefaults() {
    setFormState(defaultLegalSettings);
    setMessage("Se cargaron los valores legales base de julio 2026.");
  }

  function handleResetWorkspace() {
    if (!window.confirm("Esto eliminara empleados, jornadas y configuracion guardada. Continuar?")) {
      return;
    }

    resetWorkspace();
    setMessage("Workspace reiniciado correctamente.");
  }

  return (
    <Tabs defaultValue="jornada" className="space-y-4">
      <TabsList>
        <TabsTrigger value="jornada">Jornada</TabsTrigger>
        <TabsTrigger value="alertas">Alertas</TabsTrigger>
        <TabsTrigger value="workspace">Workspace</TabsTrigger>
      </TabsList>

      <TabsContent value="jornada">
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Parametros legales y operativos</CardTitle>
            <CardDescription>
              Define los topes base que usaran los nuevos empleados y las liquidaciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  type="number"
                  value={formState.jornadaSemanalMaxima}
                  onChange={(event) =>
                    updateField("jornadaSemanalMaxima", event.target.value)
                  }
                  placeholder="Jornada semanal"
                />
                <Select
                  value={String(formState.diasLaboralesSemana)}
                  onValueChange={(value) => updateField("diasLaboralesSemana", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 dias</SelectItem>
                    <SelectItem value="6">6 dias</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={formState.limiteExtrasDiarias}
                  onChange={(event) =>
                    updateField("limiteExtrasDiarias", event.target.value)
                  }
                  placeholder="Extras diarias"
                />
                <Input
                  type="number"
                  value={formState.limiteExtrasSemanales}
                  onChange={(event) =>
                    updateField("limiteExtrasSemanales", event.target.value)
                  }
                  placeholder="Extras semanales"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  type="time"
                  value={formState.horarioNocturnoInicio}
                  onChange={(event) =>
                    updateField("horarioNocturnoInicio", event.target.value)
                  }
                />
                <Input
                  type="time"
                  value={formState.horarioNocturnoFin}
                  onChange={(event) =>
                    updateField("horarioNocturnoFin", event.target.value)
                  }
                />
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={formState.recargoDescansoObligatorio}
                  onChange={(event) =>
                    updateField("recargoDescansoObligatorio", event.target.value)
                  }
                  placeholder="Recargo descanso"
                />
                <Input
                  type="date"
                  value={formState.fechaNormativa}
                  onChange={(event) => updateField("fechaNormativa", event.target.value)}
                />
              </div>

              {message ? (
                <div className="rounded-2xl bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                  {message}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit">Guardar configuracion</Button>
                <Button type="button" variant="outline" onClick={restoreDefaults}>
                  Restaurar valores legales
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="alertas">
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Automatizaciones y alertas</CardTitle>
            <CardDescription>
              Ajusta el comportamiento del workspace ante novedades y cierres semanales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-background/50 px-4 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">Alertas automaticas</p>
                <p className="text-sm text-muted-foreground">
                  Muestra banderas cuando se superan topes legales o condiciones especiales.
                </p>
              </div>
              <Switch
                checked={formState.alertasAutomaticas}
                onCheckedChange={(checked) => updateField("alertasAutomaticas", checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border bg-background/50 px-4 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">Cierre semanal automatico</p>
                <p className="text-sm text-muted-foreground">
                  Prepara cortes semanales para revision administrativa.
                </p>
              </div>
              <Switch
                checked={formState.cierreSemanalAutomatico}
                onCheckedChange={(checked) =>
                  updateField("cierreSemanalAutomatico", checked)
                }
              />
            </div>

            <div className="rounded-2xl border border-border bg-background/50 px-4 py-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Ley base</Badge>
                <span className="text-sm text-foreground">{formState.fechaNormativa}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Horario nocturno configurado de {formState.horarioNocturnoInicio} a{" "}
                {formState.horarioNocturnoFin} con recargo de descanso obligatorio en{" "}
                {Math.round(Number(formState.recargoDescansoObligatorio) * 100)}%.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="workspace">
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Mantenimiento del workspace</CardTitle>
            <CardDescription>
              Usa estas acciones con cuidado. Los datos se guardan en el navegador actual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border bg-background/50 px-4 py-4">
              <p className="text-sm font-medium text-foreground">Persistencia local</p>
              <p className="mt-2 text-sm text-muted-foreground">
                El estado de Tempo se conserva entre sesiones del navegador hasta que lo reinicies.
              </p>
            </div>

            <Button type="button" variant="destructive" onClick={handleResetWorkspace}>
              Reiniciar workspace
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
