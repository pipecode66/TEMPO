import Link from "next/link";

import { LoginScreen } from "@/components/auth/login-screen";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/60 px-6 py-4 text-center">
        <p className="text-sm text-muted-foreground">
          La ruta solicitada no estuvo disponible. Te devolvimos al acceso principal de
          Tempo.
        </p>
        <Link href="/" className="mt-2 inline-block text-sm font-medium text-foreground underline underline-offset-4">
          Ir al inicio
        </Link>
      </div>
      <LoginScreen />
    </div>
  );
}
