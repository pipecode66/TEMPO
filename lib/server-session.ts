import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/auth-cookies";
import type { UserRole } from "@/lib/tempo-api";

type CookieValue = {
  value: string;
};

type CookieStoreLike = {
  get: (name: string) => CookieValue | undefined;
};

type TokenPayload = {
  exp?: unknown;
  role?: unknown;
};

const validRoles = new Set<UserRole>(["admin", "nomina", "supervisor", "consulta"]);

function decodeTokenPayload(token: string | undefined): TokenPayload | null {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as TokenPayload;
  } catch {
    return null;
  }
}

function isTokenActive(token: string | undefined): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return false;
  }

  return payload.exp > Math.floor(Date.now() / 1000);
}

function getRoleFromToken(token: string | undefined): UserRole | null {
  const payload = decodeTokenPayload(token);
  if (!payload || typeof payload.role !== "string" || !validRoles.has(payload.role as UserRole)) {
    return null;
  }

  return payload.role as UserRole;
}

export function getAuthenticatedRedirectPath(role: UserRole | null): string {
  return role === "consulta" ? "/portal" : "/dashboard";
}

export function getServerSession(cookieStore: CookieStoreLike): {
  isAuthenticated: boolean;
  role: UserRole | null;
} {
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (isTokenActive(accessToken)) {
    return {
      isAuthenticated: true,
      role: getRoleFromToken(accessToken),
    };
  }

  if (isTokenActive(refreshToken)) {
    return {
      isAuthenticated: true,
      role: getRoleFromToken(refreshToken),
    };
  }

  return {
    isAuthenticated: false,
    role: null,
  };
}
