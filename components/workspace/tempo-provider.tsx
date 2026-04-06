"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { JornadaResponse } from "@/lib/tempo-api";

export type EmployeeStatus = "activo" | "licencia" | "retirado";

export type EmployeeRecord = {
  id: string;
  nombre: string;
  email: string;
  cargo: string;
  area: string;
  edad: number;
  salarioBase: number;
  jornadaSemanalHoras: number;
  diasLaboralesSemana: 5 | 6;
  estado: EmployeeStatus;
  createdAt: string;
};

export type EmployeeDraft = Omit<EmployeeRecord, "id" | "createdAt">;

export type CompanyProfile = {
  nombreLegal: string;
  nit: string;
  sector: string;
  sedePrincipal: string;
  responsableNomina: string;
  emailNomina: string;
  notas: string;
};

export type PolicySettings = {
  jornadaSemanalMaxima: number;
  diasLaboralesSemana: 5 | 6;
  limiteExtrasDiarias: number;
  limiteExtrasSemanales: number;
  horarioNocturnoInicio: string;
  horarioNocturnoFin: string;
  alertasAutomaticas: boolean;
  cierreSemanalAutomatico: boolean;
  recargoDescansoObligatorio: number;
  fechaNormativa: string;
};

export type TimeEntryRecord = {
  id: string;
  fecha: string;
  employeeId?: string;
  employeeName: string;
  area: string;
  horaEntrada: string;
  horaSalida: string;
  esFestivo: boolean;
  esDominical: boolean;
  acumuladoSemanalHoras: number;
  response: JornadaResponse;
  createdAt: string;
};

export type TimeEntryDraft = Omit<TimeEntryRecord, "id" | "createdAt">;

type TempoWorkspaceState = {
  employees: EmployeeRecord[];
  timeEntries: TimeEntryRecord[];
  companyProfile: CompanyProfile;
  policySettings: PolicySettings;
};

type TempoWorkspaceContextValue = TempoWorkspaceState & {
  hydrated: boolean;
  addEmployee: (employee: EmployeeDraft) => void;
  updateEmployeeStatus: (employeeId: string, status: EmployeeStatus) => void;
  removeEmployee: (employeeId: string) => void;
  addTimeEntry: (entry: TimeEntryDraft) => void;
  saveCompanyProfile: (profile: CompanyProfile) => void;
  savePolicySettings: (settings: PolicySettings) => void;
  resetWorkspace: () => void;
};

const STORAGE_KEY = "tempo-workspace-v1";

const defaultWorkspaceState: TempoWorkspaceState = {
  employees: [],
  timeEntries: [],
  companyProfile: {
    nombreLegal: "",
    nit: "",
    sector: "",
    sedePrincipal: "",
    responsableNomina: "",
    emailNomina: "",
    notas: "",
  },
  policySettings: {
    jornadaSemanalMaxima: 42,
    diasLaboralesSemana: 5,
    limiteExtrasDiarias: 2,
    limiteExtrasSemanales: 12,
    horarioNocturnoInicio: "19:00",
    horarioNocturnoFin: "06:00",
    alertasAutomaticas: true,
    cierreSemanalAutomatico: false,
    recargoDescansoObligatorio: 0.9,
    fechaNormativa: "2026-07-15",
  },
};

const TempoWorkspaceContext = createContext<TempoWorkspaceContextValue | null>(
  null,
);

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeState(
  input: Partial<TempoWorkspaceState> | null | undefined,
): TempoWorkspaceState {
  return {
    employees: Array.isArray(input?.employees) ? input.employees : [],
    timeEntries: Array.isArray(input?.timeEntries) ? input.timeEntries : [],
    companyProfile: {
      ...defaultWorkspaceState.companyProfile,
      ...input?.companyProfile,
    },
    policySettings: {
      ...defaultWorkspaceState.policySettings,
      ...input?.policySettings,
    },
  };
}

export function TempoProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] =
    useState<TempoWorkspaceState>(defaultWorkspaceState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored) {
        setWorkspace(sanitizeState(JSON.parse(stored) as TempoWorkspaceState));
      }
    } catch {
      setWorkspace(defaultWorkspaceState);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace, hydrated]);

  const value: TempoWorkspaceContextValue = {
    ...workspace,
    hydrated,
    addEmployee: (employee) => {
      setWorkspace((current) => ({
        ...current,
        employees: [
          {
            ...employee,
            id: createId(),
            createdAt: new Date().toISOString(),
          },
          ...current.employees,
        ],
      }));
    },
    updateEmployeeStatus: (employeeId, status) => {
      setWorkspace((current) => ({
        ...current,
        employees: current.employees.map((employee) =>
          employee.id === employeeId ? { ...employee, estado: status } : employee,
        ),
      }));
    },
    removeEmployee: (employeeId) => {
      setWorkspace((current) => ({
        ...current,
        employees: current.employees.filter((employee) => employee.id !== employeeId),
        timeEntries: current.timeEntries.filter(
          (entry) => entry.employeeId !== employeeId,
        ),
      }));
    },
    addTimeEntry: (entry) => {
      setWorkspace((current) => ({
        ...current,
        timeEntries: [
          {
            ...entry,
            id: createId(),
            createdAt: new Date().toISOString(),
          },
          ...current.timeEntries,
        ],
      }));
    },
    saveCompanyProfile: (profile) => {
      setWorkspace((current) => ({
        ...current,
        companyProfile: profile,
      }));
    },
    savePolicySettings: (settings) => {
      setWorkspace((current) => ({
        ...current,
        policySettings: settings,
      }));
    },
    resetWorkspace: () => {
      setWorkspace(defaultWorkspaceState);
    },
  };

  return (
    <TempoWorkspaceContext.Provider value={value}>
      {children}
    </TempoWorkspaceContext.Provider>
  );
}

export function useTempoWorkspace(): TempoWorkspaceContextValue {
  const context = useContext(TempoWorkspaceContext);

  if (!context) {
    throw new Error("useTempoWorkspace must be used inside TempoProvider.");
  }

  return context;
}
