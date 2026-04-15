import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { EmployeePortal } from "@/components/portal/employee-portal";
import { getServerSession } from "@/lib/server-session";

export default async function PortalPage() {
  const cookieStore = await cookies();
  const session = getServerSession(cookieStore);

  if (!session.isAuthenticated) {
    redirect("/");
  }

  if (session.role && session.role !== "consulta") {
    redirect("/dashboard");
  }

  return <EmployeePortal />;
}
