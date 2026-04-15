import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginScreen } from "@/components/auth/login-screen";
import { getAuthenticatedRedirectPath, getServerSession } from "@/lib/server-session";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const session = getServerSession(cookieStore);

  if (session.isAuthenticated) {
    redirect(getAuthenticatedRedirectPath(session.role));
  }

  return <LoginScreen />;
}
