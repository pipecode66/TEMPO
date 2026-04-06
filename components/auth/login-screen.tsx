"use client";

import { type FormEvent, useState, useEffect } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Gauge,
  Shield,
  Timer,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ADMIN_ACCOUNT = {
  email: "admin@empresa.com",
  password: "Admin123!",
  role: "Administrador",
};

const features = [
  {
    icon: Gauge,
    title: "Control preciso",
    description: "Seguimiento de jornadas",
  },
  {
    icon: TrendingUp,
    title: "Horas extras",
    description: "Calculo automatico",
  },
  {
    icon: Zap,
    title: "Tiempo real",
    description: "Alertas instantaneas",
  },
  {
    icon: Users,
    title: "Empleados",
    description: "Gestion centralizada",
  },
];

function AnimatedClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = time?.getSeconds() ?? 0;
  const minutes = time?.getMinutes() ?? 0;
  const hours = (time?.getHours() ?? 0) % 12;

  return (
    <div className="relative h-48 w-48">
      {/* Outer ring with glow */}
      <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
      <div className="absolute inset-2 rounded-full border border-border" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-transparent" />
      
      {/* Clock marks */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 h-2 w-0.5 -translate-x-1/2 origin-bottom bg-muted-foreground/40"
          style={{
            transform: `translateX(-50%) rotate(${i * 30}deg) translateY(-88px)`,
          }}
        />
      ))}
      
      {/* Center dot */}
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-lg shadow-primary/50" />
      
      {/* Hour hand */}
      <div
        className="absolute left-1/2 top-1/2 h-14 w-1 -translate-x-1/2 origin-bottom rounded-full bg-foreground"
        style={{
          transform: `translateX(-50%) rotate(${hours * 30 + minutes * 0.5}deg) translateY(-100%)`,
        }}
      />
      
      {/* Minute hand */}
      <div
        className="absolute left-1/2 top-1/2 h-20 w-0.5 -translate-x-1/2 origin-bottom rounded-full bg-foreground"
        style={{
          transform: `translateX(-50%) rotate(${minutes * 6}deg) translateY(-100%)`,
        }}
      />
      
      {/* Second hand */}
      <div
        className="absolute left-1/2 top-1/2 h-20 w-px -translate-x-1/2 origin-bottom bg-primary"
        style={{
          transform: `translateX(-50%) rotate(${seconds * 6}deg) translateY(-100%)`,
          transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)',
        }}
      />
    </div>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const isValidAdmin =
      email === ADMIN_ACCOUNT.email && password === ADMIN_ACCOUNT.password;

    if (isValidAdmin) {
      setSuccess(`Acceso correcto. Redirigiendo al panel de ${ADMIN_ACCOUNT.role}...`);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } else {
      setError("Credenciales invalidas.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - Brand showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div className="absolute inset-0 radial-overlay" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        
        {/* Floating elements */}
        <div className="absolute right-20 top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-20 bottom-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30">
                <Timer className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-semibold tracking-tight text-foreground">
                TEMPO
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-primary">
                Enterprise
              </span>
            </div>
          </div>

          {/* Center content */}
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <AnimatedClock />
            
            <div className="mt-12 text-left max-w-lg">
              <h1 className="text-4xl xl:text-5xl font-semibold text-foreground leading-tight">
                Control de Tiempos
                <span className="block mt-2 tempo-gradient-text">Inteligente</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Software empresarial para optimizar la gestion del tiempo de tu equipo.
              </p>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group flex items-start gap-3 rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card"
              >
                <div className="rounded-lg bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>


        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24">
        <div className="max-w-md mx-auto w-full">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
                <Timer className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-semibold tracking-tight text-foreground">
                TEMPO
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-primary">
                Enterprise
              </span>
            </div>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-foreground">Bienvenido</h2>
            <p className="mt-2 text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-6">
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
                className="h-12 rounded-xl bg-card border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
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
                  className="h-12 rounded-xl bg-card border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 pr-12 transition-all"
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

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-tempo-success/10 border border-tempo-success/20">
                <CheckCircle2 className="w-5 h-5 text-tempo-success shrink-0" />
                <p className="text-sm text-tempo-success">{success}</p>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base group transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  <span>Verificando...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  Iniciar sesion
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>

          {/* Footer info */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Conexion segura SSL/TLS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
