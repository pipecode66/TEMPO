import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginScreen } from "@/components/auth/login-screen";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/auth-cookies";

function getCookieRole(token: string | undefined): string | null {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    return typeof parsed.role === "string" ? parsed.role : null;
  } catch {
    return null;
  }
}

export default async function LoginPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
  if (
    accessToken ||
    refreshToken
  ) {
    redirect(getCookieRole(accessToken) === "consulta" ? "/portal" : "/dashboard");
  }

  return <LoginScreen />;
}
