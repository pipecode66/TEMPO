"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiResponseError } from "@/lib/fetch-json";
import {
  type AuthenticatedUser,
  type LoginRequest,
  type UserRole,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
} from "@/lib/tempo-api";

type PermissionSet = {
  canManageEmployees: boolean;
  canManageTimeEntries: boolean;
  canManageCompany: boolean;
  canManageSettings: boolean;
  canApproveAttendance: boolean;
  canViewAudit: boolean;
};

type AuthContextValue = {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  permissions: PermissionSet;
  login: (payload: LoginRequest) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<AuthenticatedUser | null>;
  hasAnyRole: (...roles: UserRole[]) => boolean;
};

const emptyPermissions: PermissionSet = {
  canManageEmployees: false,
  canManageTimeEntries: false,
  canManageCompany: false,
  canManageSettings: false,
  canApproveAttendance: false,
  canViewAudit: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

function resolvePermissions(role: UserRole | undefined): PermissionSet {
  switch (role) {
    case "admin":
      return {
        canManageEmployees: true,
        canManageTimeEntries: true,
        canManageCompany: true,
        canManageSettings: true,
        canApproveAttendance: true,
        canViewAudit: true,
      };
    case "nomina":
      return {
        canManageEmployees: true,
        canManageTimeEntries: true,
        canManageCompany: true,
        canManageSettings: true,
        canApproveAttendance: true,
        canViewAudit: true,
      };
    case "supervisor":
      return {
        canManageEmployees: true,
        canManageTimeEntries: true,
        canManageCompany: false,
        canManageSettings: false,
        canApproveAttendance: true,
        canViewAudit: false,
      };
    default:
      return emptyPermissions;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async (): Promise<AuthenticatedUser | null> => {
    try {
      const currentUser = await getCurrentUser();
      startTransition(() => {
        setUser(currentUser);
      });
      return currentUser;
    } catch (error) {
      if (!(error instanceof ApiResponseError) || error.status !== 401) {
        startTransition(() => {
          setUser(null);
        });
        throw error;
      }

      try {
        const refreshed = await refreshSession();
        startTransition(() => {
          setUser(refreshed.user);
        });
        return refreshed.user;
      } catch {
        startTransition(() => {
          setUser(null);
        });
        return null;
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const currentUser = await refreshAuth();
        if (cancelled) {
          return;
        }
        startTransition(() => {
          setUser(currentUser);
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [refreshAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      permissions: resolvePermissions(user?.role),
      login: async (payload) => {
        const response = await loginRequest(payload);
        startTransition(() => {
          setUser(response.user);
        });
        return response.user;
      },
      logout: async () => {
        try {
          await logoutRequest();
        } finally {
          startTransition(() => {
            setUser(null);
          });
        }
      },
      refreshAuth,
      hasAnyRole: (...roles) => {
        if (!user) {
          return false;
        }
        return roles.includes(user.role);
      },
    }),
    [isLoading, refreshAuth, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
