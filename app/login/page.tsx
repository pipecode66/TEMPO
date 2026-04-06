import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginScreen } from "@/components/auth/login-screen";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/auth-cookies";

export default async function LoginPage() {
  const cookieStore = await cookies();
  if (
    cookieStore.has(ACCESS_COOKIE_NAME) ||
    cookieStore.has(REFRESH_COOKIE_NAME)
  ) {
    redirect("/dashboard");
  }

  return <LoginScreen />;
}
