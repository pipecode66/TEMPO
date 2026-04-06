"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Clock, Building2, Users, Shield, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Credenciales de demostración
const DEMO_CREDENTIALS = {
  admin: { email: "admin@empresa.com", password: "Admin123!", role: "Administrador", name: "Carlos Rodríguez" },
  rrhh: { email: "rrhh@empresa.com", password: "RRHH2024!", role: "Recursos Humanos", name: "María García" },
  empleado: { email: "empleado@empresa.com", password: "Emp2024!", role: "Empleado", name: "Juan Pérez" },
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Simular delay de autenticación
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Verificar credenciales de demostración
    const user = Object.values(DEMO_CREDENTIALS).find(
      (cred) => cred.email === email && cred.password === password
    );

    if (user) {
      setSuccess(`Bienvenido, ${user.name}. Redirigiendo al panel de ${user.role}...`);
      // Aquí iría la redirección al dashboard correspondiente
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } else {
      setError("Credenciales inválidas. Usa las credenciales de demostración.");
    }

    setIsLoading(false);
  };

  const fillDemoCredentials = (type: keyof typeof DEMO_CREDENTIALS) => {
    setEmail(DEMO_CREDENTIALS[type].email);
    setPassword(DEMO_CREDENTIALS[type].password);
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Panel Izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background con gradiente y patrón */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Contenido del panel izquierdo */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Clock className="w-8 h-8 text-foreground" />
            <span className="font-display text-2xl tracking-tight text-foreground">Tempo</span>
            <span className="font-mono text-xs text-muted-foreground mt-1">PRO</span>
          </div>

          {/* Mensaje principal */}
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-5xl xl:text-6xl text-foreground leading-tight">
                Control de Tiempos
                <br />
                <span className="text-muted-foreground">Inteligente</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
                Sistema integral de gestión de nómina colombiana con cálculo automático de recargos, 
                horas extras y cumplimiento legal actualizado a la Ley 2101.
              </p>
            </div>

            {/* Features destacadas */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Building2 className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Multi-empresa</p>
                  <p className="text-xs text-muted-foreground">Gestiona múltiples sedes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Users className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Sin límite</p>
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
                  <p className="text-xs text-muted-foreground">Cálculos automáticos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer del panel */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Actualizado a julio 2026</p>
            <p>Ley 2101 / CST Colombia</p>
          </div>
        </div>

        {/* Elemento decorativo */}
        <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-foreground/5 to-transparent blur-3xl" />
      </div>

      {/* Panel Derecho - Formulario de Login */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24">
        <div className="max-w-md mx-auto w-full">
          {/* Header móvil */}
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <Clock className="w-6 h-6 text-foreground" />
            <span className="font-display text-xl tracking-tight text-foreground">Tempo</span>
            <span className="font-mono text-xs text-muted-foreground">PRO</span>
          </div>

          {/* Título del formulario */}
          <div className="mb-8">
            <h2 className="text-3xl font-display text-foreground">Iniciar sesión</h2>
            <p className="mt-2 text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Credenciales de demostración */}
          <div className="mb-8 p-4 rounded-xl border border-border bg-card/50">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Credenciales de demostración
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials("admin")}
                className="px-3 py-1.5 text-xs rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
              >
                Administrador
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials("rrhh")}
                className="px-3 py-1.5 text-xs rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
              >
                Recursos Humanos
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials("empleado")}
                className="px-3 py-1.5 text-xs rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
              >
                Empleado
              </button>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Campo Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Correo electrónico
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

            {/* Campo Contraseña */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contraseña
                </label>
                <Link 
                  href="#" 
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-card border-border focus:border-foreground/30 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Mensajes de error/éxito */}
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

            {/* Botón de submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-medium text-base group"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  <span>Verificando...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  Iniciar sesión
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>

          {/* Separador */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">o continúa con</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Opciones adicionales de login */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl border-border hover:bg-card"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl border-border hover:bg-card"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </Button>
          </div>

          {/* Link de registro */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link href="#" className="text-foreground hover:underline font-medium">
              Solicita una demo
            </Link>
          </p>

          {/* Volver al inicio */}
          <div className="mt-8 pt-8 border-t border-border">
            <Link 
              href="/"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
