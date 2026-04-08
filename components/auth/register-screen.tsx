"use client";

import { startTransition, type FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Shield,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/fetch-json";

export function RegisterScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, register, user } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [companyNit, setCompanyNit] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      startTransition(() => {
        router.replace(user?.role === "consulta" ? "/portal" : "/dashboard");
      });
    }
  }, [isAuthenticated, isAuthLoading, router, user?.role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("La confirmacion de la contrasena no coincide.");
      return;
    }

    setIsSubmitting(true);
    try {
      const authenticatedUser = await register({
        company_name: companyName.trim(),
        company_nit: companyNit.trim(),
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setSuccess(
        `Empresa creada correctamente. Redirigiendo al panel de ${authenticatedUser.full_name}...`,
      );
      startTransition(() => {
        router.replace(
          authenticatedUser.role === "consulta" ? "/portal" : "/dashboard",
        );
      });
    } catch (registerError) {
      setError(getApiErrorMessage(registerError));
      setSuccess("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          <div className="flex items-center gap-2">
            <Clock className="h-8 w-8 text-foreground" />
            <span className="font-display text-2xl tracking-tight text-foreground">Tempo</span>
            <span className="mt-1 font-mono text-xs text-muted-foreground">PRO</span>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="font-display text-5xl leading-tight text-foreground xl:text-6xl">
                Activa tu empresa
                <br />
                <span className="text-muted-foreground">en minutos</span>
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
                Crea la compania, configura el usuario administrador y entra de una vez
                al workspace para arrancar empleados, turnos y aprobaciones.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-secondary p-2">
                  <Building2 className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Alta inicial</p>
                  <p className="text-xs text-muted-foreground">Empresa y admin en un paso</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-secondary p-2">
                  <UserRound className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Acceso inmediato</p>
                  <p className="text-xs text-muted-foreground">Sesion abierta al finalizar</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-secondary p-2">
                  <Shield className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Base legal</p>
                  <p className="text-xs text-muted-foreground">Configuracion inicial productiva</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-secondary p-2">
                  <Clock className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Listo para operar</p>
                  <p className="text-xs text-muted-foreground">Portal, QR y aprobaciones</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Registro inicial de compania</p>
            <p>Entrega lista para despliegue</p>
          </div>
        </div>

        <div className="absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-gradient-to-br from-foreground/5 to-transparent blur-3xl" />
      </div>

      <div className="flex w-full flex-col justify-center px-8 sm:px-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-lg">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-foreground" />
              <span className="font-display text-xl tracking-tight text-foreground">Tempo</span>
              <span className="font-mono text-xs text-muted-foreground">PRO</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-display text-foreground">Crear empresa y cuenta</h2>
            <p className="mt-2 text-muted-foreground">
              Registra la compania y el usuario administrador que gestionara la operacion.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="company-name" className="text-sm font-medium text-foreground">
                  Nombre de la empresa
                </label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="Tempo SAS"
                  required
                  className="h-12 border-border bg-card focus:border-foreground/30"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="company-nit" className="text-sm font-medium text-foreground">
                  NIT
                </label>
                <Input
                  id="company-nit"
                  value={companyNit}
                  onChange={(event) => setCompanyNit(event.target.value)}
                  placeholder="900123456-7"
                  required
                  className="h-12 border-border bg-card focus:border-foreground/30"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="full-name" className="text-sm font-medium text-foreground">
                  Nombre del administrador
                </label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Laura Torres"
                  required
                  className="h-12 border-border bg-card focus:border-foreground/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Correo electronico
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@empresa.com"
                required
                className="h-12 border-border bg-card focus:border-foreground/30"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contrasena
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimo 8 caracteres"
                    required
                    minLength={8}
                    className="h-12 border-border bg-card pr-12 focus:border-foreground/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-foreground"
                >
                  Confirmar contrasena
                </label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repite la contrasena"
                    required
                    minLength={8}
                    className="h-12 border-border bg-card pr-12 focus:border-foreground/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={
                      showConfirmPassword ? "Ocultar contrasena" : "Mostrar contrasena"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : null}

            {success ? (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                <p className="text-sm text-green-500">{success}</p>
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting || isAuthLoading}
              className="group h-12 w-full rounded-xl bg-foreground text-base font-medium text-background hover:bg-foreground/90"
            >
              {isSubmitting || isAuthLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                  <span>Creando entorno...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  Crear empresa y entrar
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ya tienes cuenta?{" "}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Iniciar sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
