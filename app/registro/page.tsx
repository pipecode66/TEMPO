import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { RegisterScreen } from "@/components/auth/register-screen";
import { getAuthenticatedRedirectPath, getServerSession } from "@/lib/server-session";

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const session = getServerSession(cookieStore);

  if (session.isAuthenticated) {
    redirect(getAuthenticatedRedirectPath(session.role));
  }

  return <RegisterScreen />;
}
