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

import { useAuth } from "@/components/auth/auth-provider";
import { getApiErrorMessage, ApiResponseError } from "@/lib/fetch-json";
import {
  type AuditEventResponse,
  type CompanyResponse,
  type CompanySettingsResponse,
  type EmployeeCreateRequest,
  type EmployeePortalAccessRequest,
  type EmployeeResponse,
  type EmployeeStatus,
  type ReportFilters,
  type ReportResponse,
  type TimeEntryCreateRequest,
  type TimeEntryImportResponse,
  type TimeEntryResponse,
  createEmployee,
  createTimeEntry,
  deleteEmployee,
  deleteTimeEntry,
  downloadImportErrors,
  downloadReportCsv,
  downloadReportJson,
  enableEmployeePortalAccess,
  getCompanyProfile,
  getReports,
  importTimeEntries,
  listAuditEvents,
  listEmployees,
  listTimeEntries,
  updateCompanyProfile,
  updateEmployee,
} from "@/lib/tempo-api";

export type { EmployeeStatus } from "@/lib/tempo-api";

export type EmployeeRecord = {
  id: string;
  externalCode?: string | null;
  nombre: string;
  email: string;
  cargo: string;
  area: string;
  edad: number;
  salarioBase: number;
  jornadaSemanalHoras: number;
  diasLaboralesSemana: 5 | 6;
  estado: EmployeeStatus;
  jurisdictionCode: string;
  portalAccessEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeDraft = {
  externalCode?: string | null;
  nombre: string;
  email: string;
  cargo: string;
  area: string;
  edad: number;
  salarioBase: number;
  jornadaSemanalHoras: number;
  diasLaboralesSemana: 5 | 6;
  estado: EmployeeStatus;
  jurisdictionCode: string;
};

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
  jurisdictionCode: string;
  countryCode: string;
  subdivisionCode: string;
  jornadaSemanalMaxima: number;
  diasLaboralesSemana: 5 | 6;
  limiteExtrasDiarias: number;
  limiteExtrasSemanales: number;
  horarioNocturnoInicio: string;
  horarioNocturnoFin: string;
  alertasAutomaticas: boolean;
  cierreSemanalAutomatico: boolean;
  requiresQrForField: boolean;
  recargoDescansoObligatorio: number;
  fechaNormativa: string;
};

export type TimeEntryRecord = {
  id: string;
  fecha: string;
  employeeId: string;
  employeeName: string;
  area: string;
  horaEntrada: string;
  horaSalida: string;
  esFestivo: boolean;
  esDominical: boolean;
  acumuladoSemanalHoras: number;
  source: string;
  notes: string;
  response: TimeEntryResponse["calculation_result"];
  createdAt: string;
  updatedAt: string;
};

export type TimeEntryDraft = {
  employeeId: string;
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  esFestivo: boolean;
  esDominical: boolean;
  acumuladoSemanalHoras: number;
  notes?: string;
};

export type AuditEventRecord = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type TempoWorkspaceState = {
  employees: EmployeeRecord[];
  timeEntries: TimeEntryRecord[];
  companyProfile: CompanyProfile;
  policySettings: PolicySettings;
  report: ReportResponse | null;
  auditEvents: AuditEventRecord[];
  hydrated: boolean;
  isSyncing: boolean;
  lastError: string | null;
  lastImportResult: TimeEntryImportResponse | null;
};

type TempoWorkspaceContextValue = TempoWorkspaceState & {
  refreshWorkspace: () => Promise<void>;
  addEmployee: (employee: EmployeeDraft) => Promise<EmployeeRecord>;
  updateEmployeeStatus: (
    employeeId: string,
    status: EmployeeStatus,
  ) => Promise<EmployeeRecord>;
  provisionEmployeePortalAccess: (
    employeeId: string,
    payload: EmployeePortalAccessRequest,
  ) => Promise<EmployeeRecord>;
  removeEmployee: (employeeId: string) => Promise<void>;
  addTimeEntry: (entry: TimeEntryDraft) => Promise<TimeEntryRecord>;
  removeTimeEntry: (entryId: string) => Promise<void>;
  saveCompanyProfile: (profile: CompanyProfile) => Promise<void>;
  savePolicySettings: (settings: PolicySettings) => Promise<void>;
  fetchReports: (filters?: ReportFilters) => Promise<ReportResponse>;
  exportReport: (format: "csv" | "json", filters?: ReportFilters) => Promise<string>;
  refreshAudit: (limit?: number) => Promise<void>;
  importEntries: (
    file: File,
    options?: {
      createMissingEmployees?: boolean;
      mapping?: Record<string, string>;
    },
  ) => Promise<TimeEntryImportResponse>;
  downloadImportErrorsCsv: (path: string) => Promise<string>;
  clearError: () => void;
};

const defaultCompanyProfile: CompanyProfile = {
  nombreLegal: "",
  nit: "",
  sector: "",
  sedePrincipal: "",
  responsableNomina: "",
  emailNomina: "",
  notas: "",
};

const defaultPolicySettings: PolicySettings = {
  jurisdictionCode: "co-national-2026",
  countryCode: "CO",
  subdivisionCode: "",
  jornadaSemanalMaxima: 42,
  diasLaboralesSemana: 5,
  limiteExtrasDiarias: 2,
  limiteExtrasSemanales: 12,
  horarioNocturnoInicio: "19:00",
  horarioNocturnoFin: "06:00",
  alertasAutomaticas: true,
  cierreSemanalAutomatico: false,
  requiresQrForField: false,
  recargoDescansoObligatorio: 0.9,
  fechaNormativa: "2026-07-15",
};

const TempoWorkspaceContext = createContext<TempoWorkspaceContextValue | null>(null);

function mapCompanyProfile(company: CompanyResponse): CompanyProfile {
  return {
    nombreLegal: company.name,
    nit: company.nit,
    sector: company.sector ?? "",
    sedePrincipal: company.headquarters ?? "",
    responsableNomina: company.payroll_contact_name ?? "",
    emailNomina: company.payroll_contact_email ?? "",
    notas: company.notes ?? "",
  };
}

function mapPolicySettings(settings: CompanySettingsResponse): PolicySettings {
  return {
    jurisdictionCode: settings.jurisdiction_code,
    countryCode: settings.country_code,
    subdivisionCode: settings.subdivision_code ?? "",
    jornadaSemanalMaxima: settings.jornada_semanal_maxima,
    diasLaboralesSemana: settings.dias_laborales_semana,
    limiteExtrasDiarias: settings.limite_extras_diarias,
    limiteExtrasSemanales: settings.limite_extras_semanales,
    horarioNocturnoInicio: settings.horario_nocturno_inicio,
    horarioNocturnoFin: settings.horario_nocturno_fin,
    alertasAutomaticas: settings.alertas_automaticas,
    cierreSemanalAutomatico: settings.cierre_semanal_automatico,
    requiresQrForField: settings.requires_qr_for_field,
    recargoDescansoObligatorio: settings.recargo_descanso_obligatorio,
    fechaNormativa: settings.fecha_normativa,
  };
}

function mapEmployee(employee: EmployeeResponse): EmployeeRecord {
  return {
    id: employee.id,
    externalCode: employee.external_code,
    nombre: employee.full_name,
    email: employee.email ?? "",
    cargo: employee.position,
    area: employee.area,
    edad: employee.age,
    salarioBase: employee.base_salary,
    jornadaSemanalHoras: employee.weekly_hours,
    diasLaboralesSemana: employee.work_days_per_week,
    estado: employee.status,
    jurisdictionCode: employee.jurisdiction_code,
    portalAccessEnabled: employee.portal_access_enabled,
    createdAt: employee.created_at,
    updatedAt: employee.updated_at,
  };
}

function mapTimeEntry(entry: TimeEntryResponse): TimeEntryRecord {
  return {
    id: entry.id,
    fecha: entry.work_date,
    employeeId: entry.employee_id,
    employeeName: entry.employee_name,
    area: entry.area,
    horaEntrada: entry.check_in.slice(0, 5),
    horaSalida: entry.check_out.slice(0, 5),
    esFestivo: entry.is_holiday,
    esDominical: entry.is_sunday,
    acumuladoSemanalHoras: entry.weekly_accumulated_hours,
    source: entry.source,
    notes: entry.notes ?? "",
    response: entry.calculation_result,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  };
}

function mapAuditEvent(event: AuditEventResponse): AuditEventRecord {
  return {
    id: event.id,
    action: event.action,
    entityType: event.entity_type,
    entityId: event.entity_id,
    actorUserId: event.actor_user_id,
    before: event.before_json,
    after: event.after_json,
    metadata: event.metadata_json,
    createdAt: event.created_at,
  };
}

function mapEmployeeDraftToApi(employee: EmployeeDraft): EmployeeCreateRequest {
  return {
    external_code: employee.externalCode ?? null,
    full_name: employee.nombre,
    email: employee.email || null,
    position: employee.cargo,
    area: employee.area,
    age: employee.edad,
    base_salary: employee.salarioBase,
    weekly_hours: employee.jornadaSemanalHoras,
    work_days_per_week: employee.diasLaboralesSemana,
    status: employee.estado,
    jurisdiction_code: employee.jurisdictionCode,
  };
}

function mapTimeEntryDraftToApi(entry: TimeEntryDraft): TimeEntryCreateRequest {
  return {
    employee_id: entry.employeeId,
    work_date: entry.fecha,
    check_in: entry.horaEntrada,
    check_out: entry.horaSalida,
    is_holiday: entry.esFestivo,
    is_sunday: entry.esDominical,
    weekly_accumulated_hours: entry.acumuladoSemanalHoras,
    notes: entry.notes ?? "",
  };
}

export function TempoProvider({ children }: { children: ReactNode }) {
  const { permissions, refreshAuth, user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntryRecord[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(defaultCompanyProfile);
  const [policySettings, setPolicySettings] = useState<PolicySettings>(defaultPolicySettings);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEventRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastImportResult, setLastImportResult] =
    useState<TimeEntryImportResponse | null>(null);

  const runWithSessionRetry = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      try {
        return await operation();
      } catch (error) {
        if (!(error instanceof ApiResponseError) || error.status !== 401) {
          throw error;
        }

        const refreshedUser = await refreshAuth();
        if (!refreshedUser) {
          throw error;
        }

        return operation();
      }
    },
    [refreshAuth],
  );

  const loadWorkspace = useCallback(
    async (filters?: ReportFilters) => {
      if (!user) {
        startTransition(() => {
          setEmployees([]);
          setTimeEntries([]);
          setReport(null);
          setAuditEvents([]);
          setCompanyProfile(defaultCompanyProfile);
          setPolicySettings(defaultPolicySettings);
          setHydrated(true);
          setIsSyncing(false);
        });
        return;
      }

      setIsSyncing(true);
      setLastError(null);

      try {
        const [company, employeeList, timeEntryList, reportData, auditList] =
          await Promise.all([
            runWithSessionRetry(() => getCompanyProfile()),
            runWithSessionRetry(() => listEmployees()),
            runWithSessionRetry(() => listTimeEntries(filters)),
            runWithSessionRetry(() => getReports(filters)),
            permissions.canViewAudit
              ? runWithSessionRetry(() => listAuditEvents(100))
              : Promise.resolve([]),
          ]);

        startTransition(() => {
          setCompanyProfile(mapCompanyProfile(company));
          setPolicySettings(mapPolicySettings(company.settings));
          setEmployees(employeeList.map(mapEmployee));
          setTimeEntries(timeEntryList.map(mapTimeEntry));
          setReport(reportData);
          setAuditEvents(auditList.map(mapAuditEvent));
          setHydrated(true);
        });
      } catch (error) {
        startTransition(() => {
          setLastError(getApiErrorMessage(error));
          setHydrated(true);
        });
      } finally {
        setIsSyncing(false);
      }
    },
    [permissions.canViewAudit, runWithSessionRetry, user],
  );

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const value = useMemo<TempoWorkspaceContextValue>(
    () => ({
      employees,
      timeEntries,
      companyProfile,
      policySettings,
      report,
      auditEvents,
      hydrated,
      isSyncing,
      lastError,
      lastImportResult,
      refreshWorkspace: async () => {
        await loadWorkspace();
      },
      addEmployee: async (employee) => {
        const created = await runWithSessionRetry(() =>
          createEmployee(mapEmployeeDraftToApi(employee)),
        );
        const mapped = mapEmployee(created);
        startTransition(() => {
          setEmployees((current) => [mapped, ...current]);
          setLastError(null);
        });
        await loadWorkspace();
        return mapped;
      },
      updateEmployeeStatus: async (employeeId, status) => {
        const updated = await runWithSessionRetry(() =>
          updateEmployee(employeeId, { status }),
        );
        const mapped = mapEmployee(updated);
        startTransition(() => {
          setEmployees((current) =>
            current.map((employee) =>
              employee.id === employeeId ? mapped : employee,
            ),
          );
          setLastError(null);
        });
        await loadWorkspace();
        return mapped;
      },
      provisionEmployeePortalAccess: async (employeeId, payload) => {
        const updated = await runWithSessionRetry(() =>
          enableEmployeePortalAccess(employeeId, payload),
        );
        const mapped = mapEmployee(updated);
        startTransition(() => {
          setEmployees((current) =>
            current.map((employee) =>
              employee.id === employeeId ? mapped : employee,
            ),
          );
          setLastError(null);
        });
        await loadWorkspace();
        return mapped;
      },
      removeEmployee: async (employeeId) => {
        await runWithSessionRetry(() => deleteEmployee(employeeId));
        startTransition(() => {
          setEmployees((current) =>
            current.filter((employee) => employee.id !== employeeId),
          );
          setLastError(null);
        });
        await loadWorkspace();
      },
      addTimeEntry: async (entry) => {
        const created = await runWithSessionRetry(() =>
          createTimeEntry(mapTimeEntryDraftToApi(entry)),
        );
        const mapped = mapTimeEntry(created);
        startTransition(() => {
          setTimeEntries((current) => [mapped, ...current]);
          setLastError(null);
        });
        await loadWorkspace();
        return mapped;
      },
      removeTimeEntry: async (entryId) => {
        await runWithSessionRetry(() => deleteTimeEntry(entryId));
        startTransition(() => {
          setTimeEntries((current) =>
            current.filter((entry) => entry.id !== entryId),
          );
          setLastError(null);
        });
        await loadWorkspace();
      },
      saveCompanyProfile: async (profile) => {
        const company = await runWithSessionRetry(() =>
          updateCompanyProfile({
            name: profile.nombreLegal,
            nit: profile.nit,
            sector: profile.sector || null,
            headquarters: profile.sedePrincipal || null,
            payroll_contact_name: profile.responsableNomina || null,
            payroll_contact_email: profile.emailNomina || null,
            notes: profile.notas || null,
            settings: {
              jurisdiction_code: policySettings.jurisdictionCode,
              country_code: policySettings.countryCode,
              subdivision_code: policySettings.subdivisionCode || null,
              jornada_semanal_maxima: policySettings.jornadaSemanalMaxima,
              dias_laborales_semana: policySettings.diasLaboralesSemana,
              limite_extras_diarias: policySettings.limiteExtrasDiarias,
              limite_extras_semanales: policySettings.limiteExtrasSemanales,
              horario_nocturno_inicio: policySettings.horarioNocturnoInicio,
              horario_nocturno_fin: policySettings.horarioNocturnoFin,
              alertas_automaticas: policySettings.alertasAutomaticas,
              cierre_semanal_automatico: policySettings.cierreSemanalAutomatico,
              requires_qr_for_field: policySettings.requiresQrForField,
              recargo_descanso_obligatorio: policySettings.recargoDescansoObligatorio,
              fecha_normativa: policySettings.fechaNormativa,
            },
          }),
        );
        startTransition(() => {
          setCompanyProfile(mapCompanyProfile(company));
          setPolicySettings(mapPolicySettings(company.settings));
          setLastError(null);
        });
        await loadWorkspace();
      },
      savePolicySettings: async (settings) => {
        const company = await runWithSessionRetry(() =>
          updateCompanyProfile({
            name: companyProfile.nombreLegal,
            nit: companyProfile.nit,
            sector: companyProfile.sector || null,
            headquarters: companyProfile.sedePrincipal || null,
            payroll_contact_name: companyProfile.responsableNomina || null,
            payroll_contact_email: companyProfile.emailNomina || null,
            notes: companyProfile.notas || null,
            settings: {
              jurisdiction_code: settings.jurisdictionCode,
              country_code: settings.countryCode,
              subdivision_code: settings.subdivisionCode || null,
              jornada_semanal_maxima: settings.jornadaSemanalMaxima,
              dias_laborales_semana: settings.diasLaboralesSemana,
              limite_extras_diarias: settings.limiteExtrasDiarias,
              limite_extras_semanales: settings.limiteExtrasSemanales,
              horario_nocturno_inicio: settings.horarioNocturnoInicio,
              horario_nocturno_fin: settings.horarioNocturnoFin,
              alertas_automaticas: settings.alertasAutomaticas,
              cierre_semanal_automatico: settings.cierreSemanalAutomatico,
              requires_qr_for_field: settings.requiresQrForField,
              recargo_descanso_obligatorio: settings.recargoDescansoObligatorio,
              fecha_normativa: settings.fechaNormativa,
            },
          }),
        );
        startTransition(() => {
          setCompanyProfile(mapCompanyProfile(company));
          setPolicySettings(mapPolicySettings(company.settings));
          setLastError(null);
        });
        await loadWorkspace();
      },
      fetchReports: async (filters) => {
        const reportData = await runWithSessionRetry(() => getReports(filters));
        const timeEntryList = await runWithSessionRetry(() => listTimeEntries(filters));
        startTransition(() => {
          setReport(reportData);
          setTimeEntries(timeEntryList.map(mapTimeEntry));
          setLastError(null);
        });
        return reportData;
      },
      exportReport: async (format, filters) => {
        const content = await runWithSessionRetry(() =>
          format === "csv" ? downloadReportCsv(filters) : downloadReportJson(filters),
        );
        return content;
      },
      refreshAudit: async (limit = 100) => {
        if (!permissions.canViewAudit) {
          startTransition(() => {
            setAuditEvents([]);
          });
          return;
        }

        const auditList = await runWithSessionRetry(() => listAuditEvents(limit));
        startTransition(() => {
          setAuditEvents(auditList.map(mapAuditEvent));
          setLastError(null);
        });
      },
      importEntries: async (file, options) => {
        const result = await runWithSessionRetry(() =>
          importTimeEntries(file, options),
        );
        startTransition(() => {
          setLastImportResult(result);
          setLastError(null);
        });
        await loadWorkspace();
        return result;
      },
      downloadImportErrorsCsv: async (path) => {
        return runWithSessionRetry(() => downloadImportErrors(path));
      },
      clearError: () => {
        setLastError(null);
      },
    }),
    [
      auditEvents,
      companyProfile,
      employees,
      hydrated,
      isSyncing,
      lastError,
      lastImportResult,
      permissions.canViewAudit,
      policySettings,
      report,
      timeEntries,
      loadWorkspace,
      runWithSessionRetry,
    ],
  );

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
