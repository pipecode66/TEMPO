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
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { getApiErrorMessage } from "@/lib/fetch-json";

export function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      startTransition(() => {
        router.replace(user?.role === "consulta" ? "/portal" : "/dashboard");
      });
    }
  }, [isAuthenticated, isAuthLoading, router, user?.role]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const authenticatedUser = await login({
        email,
        password,
      });
      setSuccess(
        `Acceso correcto. Redirigiendo al panel de ${authenticatedUser.full_name}...`,
      );
      startTransition(() => {
        router.replace(
          authenticatedUser.role === "consulta" ? "/portal" : "/dashboard",
        );
      });
    } catch (authError) {
      setError(getApiErrorMessage(authError));
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2">
            <Clock className="w-8 h-8 text-foreground" />
            <span className="font-display text-2xl tracking-tight text-foreground">Tempo</span>
            <span className="font-mono text-xs text-muted-foreground mt-1">PRO</span>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="font-display text-5xl xl:text-6xl text-foreground leading-tight">
                Control de Tiempos
                <br />
                <span className="text-muted-foreground">Inteligente</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
                Sistema integral de gestion de nomina colombiana con calculo
                automatico de recargos, horas extras y cumplimiento legal.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Building2 className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Multi-empresa</p>
                  <p className="text-xs text-muted-foreground">Gestiona multiples sedes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Users className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Sin limite</p>
                  <p className="text-xs text-muted-foreground">Empleados ilimitados</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Shield className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">100% Legal</p>
                  <p className="text-xs text-muted-foreground">Cumplimiento CST</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Clock className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Tiempo real</p>
                  <p className="text-xs text-muted-foreground">Calculos automaticos</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Actualizado a julio 2026</p>
            <p>Ley 2101 / CST Colombia</p>
          </div>
        </div>

        <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-foreground/5 to-transparent blur-3xl" />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24">
        <div className="max-w-md mx-auto w-full">
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <Clock className="w-6 h-6 text-foreground" />
            <span className="font-display text-xl tracking-tight text-foreground">Tempo</span>
            <span className="font-mono text-xs text-muted-foreground">PRO</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-display text-foreground">Iniciar sesion</h2>
            <p className="mt-2 text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Correo electronico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-card border-border focus:border-foreground/30"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contrasena
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-card border-border focus:border-foreground/30 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <p className="text-sm text-green-500">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || isAuthLoading}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-medium text-base group"
            >
              {isLoading || isAuthLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  <span>Verificando...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  Iniciar sesion
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>

          {user ? (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Sesion activa para {user.email}.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
