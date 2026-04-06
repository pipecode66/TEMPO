import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { TempoProvider } from "@/components/workspace/tempo-provider";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/auth-cookies";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  if (
    !cookieStore.has(ACCESS_COOKIE_NAME) &&
    !cookieStore.has(REFRESH_COOKIE_NAME)
  ) {
    redirect("/");
  }

  return (
    <TempoProvider>
      <WorkspaceShell>{children}</WorkspaceShell>
    </TempoProvider>
  );
}
