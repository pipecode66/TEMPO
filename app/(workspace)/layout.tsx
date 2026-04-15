import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { TempoProvider } from "@/components/workspace/tempo-provider";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { getServerSession } from "@/lib/server-session";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const session = getServerSession(cookieStore);

  if (!session.isAuthenticated) {
    redirect("/");
  }

  if (session.role === "consulta") {
    redirect("/portal");
  }

  return (
    <TempoProvider>
      <WorkspaceShell>{children}</WorkspaceShell>
    </TempoProvider>
  );
}
