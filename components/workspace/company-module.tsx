"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Building2, CheckCircle2, MapPin, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useTempoWorkspace } from "@/components/workspace/tempo-provider";

function getCompanyProgress(profile: {
  nombreLegal: string;
  nit: string;
  sector: string;
  sedePrincipal: string;
  responsableNomina: string;
  emailNomina: string;
  notas: string;
}): number {
  const fields = [
    profile.nombreLegal,
    profile.nit,
    profile.sector,
    profile.sedePrincipal,
    profile.responsableNomina,
    profile.emailNomina,
  ];

  return Math.round((fields.filter((field) => field.trim().length > 0).length / fields.length) * 100);
}

export function CompanyModule() {
  const { companyProfile, saveCompanyProfile, employees, timeEntries } = useTempoWorkspace();
  const [formState, setFormState] = useState(companyProfile);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setFormState(companyProfile);
  }, [companyProfile]);

  function updateField(field: keyof typeof formState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveCompanyProfile(formState);
    setMessage("Perfil de empresa actualizado correctamente.");
  }

  const progress = getCompanyProgress(formState);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Perfil de empresa</CardTitle>
          <CardDescription>
            Centraliza la informacion base que usara el equipo de operaciones y nomina.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                value={formState.nombreLegal}
                onChange={(event) => updateField("nombreLegal", event.target.value)}
                placeholder="Razon social"
              />
              <Input
                value={formState.nit}
                onChange={(event) => updateField("nit", event.target.value)}
                placeholder="NIT"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                value={formState.sector}
                onChange={(event) => updateField("sector", event.target.value)}
                placeholder="Sector"
              />
              <Input
                value={formState.sedePrincipal}
                onChange={(event) => updateField("sedePrincipal", event.target.value)}
                placeholder="Sede principal"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                value={formState.responsableNomina}
                onChange={(event) => updateField("responsableNomina", event.target.value)}
                placeholder="Responsable de nomina"
              />
              <Input
                type="email"
                value={formState.emailNomina}
                onChange={(event) => updateField("emailNomina", event.target.value)}
                placeholder="Email operativo"
              />
            </div>

            <Textarea
              value={formState.notas}
              onChange={(event) => updateField("notas", event.target.value)}
              placeholder="Notas internas, alcance del proyecto o instrucciones para el equipo."
            />

            {message ? (
              <div className="rounded-2xl bg-green-500/10 px-4 py-3 text-sm text-green-300">
                {message}
              </div>
            ) : null}

            <Button type="submit" className="w-full">
              Guardar perfil de empresa
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Completitud del perfil</CardTitle>
            <CardDescription>
              Entre mas completo este el perfil, mas facil sera operar el ambiente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avance</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>

            {[
              { icon: Building2, label: formState.nombreLegal || "Razon social pendiente" },
              { icon: MapPin, label: formState.sedePrincipal || "Sede principal pendiente" },
              {
                icon: UserCog,
                label: formState.responsableNomina || "Responsable de nomina pendiente",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 px-4 py-3"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Huella operativa</CardTitle>
            <CardDescription>
              Indicadores rapidos del entorno ligado a esta empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              `${employees.length} empleados registrados`,
              `${timeEntries.length} jornadas almacenadas`,
              `${formState.emailNomina || "Sin correo operativo"} como contacto principal`,
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 px-4 py-3 text-sm text-foreground"
              >
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
