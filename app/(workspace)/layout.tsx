import type { ReactNode } from "react";

import { TempoProvider } from "@/components/workspace/tempo-provider";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <TempoProvider>
      <WorkspaceShell>{children}</WorkspaceShell>
    </TempoProvider>
  );
}
