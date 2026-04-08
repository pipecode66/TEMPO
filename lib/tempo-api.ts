import { ApiResponseError, fetchJson } from "@/lib/fetch-json";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api").replace(/\/$/, "");

export type UserRole = "admin" | "nomina" | "supervisor" | "consulta";
export type EmployeeStatus = "activo" | "licencia" | "retirado";
export type TimeEntrySource = "manual" | "import" | "api";

export type AuthenticatedUser = {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token_expires_in: number;
  refresh_token_expires_in: number;
  user: AuthenticatedUser;
};

export type CompanySettingsResponse = {
  jurisdiction_code: string;
  country_code: string;
  subdivision_code: string | null;
  jornada_semanal_maxima: number;
  dias_laborales_semana: 5 | 6;
  limite_extras_diarias: number;
  limite_extras_semanales: number;
  horario_nocturno_inicio: string;
  horario_nocturno_fin: string;
  alertas_automaticas: boolean;
  cierre_semanal_automatico: boolean;
  requires_qr_for_field: boolean;
  recargo_descanso_obligatorio: number;
  fecha_normativa: string;
};

export type CompanyResponse = {
  id: string;
  name: string;
  nit: string;
  sector: string | null;
  headquarters: string | null;
  payroll_contact_name: string | null;
  payroll_contact_email: string | null;
  notes: string | null;
  settings: CompanySettingsResponse;
};

export type CompanyUpsertRequest = {
  name: string;
  nit: string;
  sector: string | null;
  headquarters: string | null;
  payroll_contact_name: string | null;
  payroll_contact_email: string | null;
  notes: string | null;
  settings: CompanySettingsResponse;
};

export type EmployeeResponse = {
  id: string;
  company_id: string;
  external_code: string | null;
  full_name: string;
  email: string | null;
  position: string;
  area: string;
  age: number;
  base_salary: number;
  weekly_hours: number;
  work_days_per_week: 5 | 6;
  status: EmployeeStatus;
  jurisdiction_code: string;
  portal_access_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type EmployeeCreateRequest = {
  external_code?: string | null;
  full_name: string;
  email?: string | null;
  position: string;
  area: string;
  age: number;
  base_salary: number;
  weekly_hours: number;
  work_days_per_week: 5 | 6;
  status: EmployeeStatus;
  jurisdiction_code?: string;
};

export type EmployeeUpdateRequest = Partial<EmployeeCreateRequest>;

export type EmployeePortalAccessRequest = {
  password: string;
};

export type JornadaBreakdownItem = {
  etiqueta: string;
  horas: number;
  recargo_porcentual: number;
  factor_total: number;
  valor_base: number;
  valor_total: number;
};

export type JornadaRequest = {
  empleado: {
    edad: number;
    salario_base: number;
  };
  hora_entrada: string;
  hora_salida: string;
  es_festivo: boolean;
  es_dominical: boolean;
  acumulado_semanal_horas: number;
  configuracion: {
    dias_laborales_semana: 5 | 6;
    horas_semanales_pactadas?: number | null;
    horas_diarias_pactadas?: number | null;
    divisor_hora_mensual?: number | null;
    jurisdiction_code?: string;
    fecha_referencia_normativa: string;
    recargo_descanso_obligatorio?: number | null;
  };
};

export type JornadaResponse = {
  valor_total_dia: number;
  valor_hora_ordinaria: number;
  costo_extra_proyectado: number;
  horas_totales_dia: number;
  desglose_horas: Record<string, JornadaBreakdownItem>;
  alerta_limite_legal: boolean;
  alertas: string[];
  reglas_aplicadas: Record<string, string | number | boolean | null>;
};

export type TimeEntryResponse = {
  id: string;
  company_id: string;
  employee_id: string;
  employee_name: string;
  area: string;
  work_date: string;
  check_in: string;
  check_out: string;
  is_holiday: boolean;
  is_sunday: boolean;
  weekly_accumulated_hours: number;
  source: TimeEntrySource;
  notes: string | null;
  calculation_result: JornadaResponse;
  created_at: string;
  updated_at: string;
};

export type TimeEntryCreateRequest = {
  employee_id: string;
  work_date: string;
  check_in: string;
  check_out: string;
  is_holiday: boolean;
  is_sunday: boolean;
  weekly_accumulated_hours?: number | null;
  notes?: string | null;
};

export type TimeEntryUpdateRequest = Partial<TimeEntryCreateRequest>;

export type ImportRowSuccess = {
  row_number: number;
  time_entry_id: string;
  employee_id: string;
  employee_name: string;
};

export type ImportRowError = {
  row_number: number;
  row_data: Record<string, string>;
  reason: string;
};

export type TimeEntryImportResponse = {
  audit_event_id: string;
  total_rows: number;
  successful_rows: number;
  rejected_rows: number;
  successes: ImportRowSuccess[];
  errors: ImportRowError[];
  error_report_download_url: string | null;
};

export type ReportSummary = {
  total_employees: number;
  total_time_entries: number;
  total_hours: number;
  total_value: number;
  legal_alerts: number;
  compliance_rate: number;
};

export type ReportRow = {
  time_entry_id: string;
  employee_id: string;
  employee_name: string;
  area: string;
  work_date: string;
  check_in: string;
  check_out: string;
  total_hours: number;
  total_value: number;
  legal_alert: boolean;
};

export type ReportResponse = {
  summary: ReportSummary;
  rows: ReportRow[];
};

export type AuditEventResponse = {
  id: string;
  company_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
};

export type JurisdictionOption = {
  code: string;
  name: string;
  country_code: string;
  subdivision_code: string | null;
  daily_overtime_limit_hours: number;
  weekly_overtime_limit_hours: number;
};

export type GeoCaptureRequest = {
  latitude: number;
  longitude: number;
  accuracy_meters?: number | null;
};

export type WorksiteResponse = {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WorksiteCreateRequest = {
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
};

export type WorksiteQrTokenCreateRequest = {
  expires_in_minutes?: number;
};

export type WorksiteQrTokenResponse = {
  id: string;
  company_id: string;
  worksite_id: string;
  token: string;
  qr_url: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AttendanceRequestResponse = {
  id: string;
  company_id: string;
  employee_id: string;
  employee_name: string;
  employee_email: string | null;
  worksite_id: string | null;
  worksite_name: string | null;
  work_date: string;
  check_in_at: string;
  check_out_at: string | null;
  status: "open" | "pending" | "approved" | "rejected";
  verification_method: "direct" | "qr";
  notes: string | null;
  justification: string | null;
  requires_justification: boolean;
  approval_comment: string | null;
  approved_by_user_id: string | null;
  approved_at: string | null;
  projected_extra_cost: number;
  preview: JornadaResponse | null;
  created_at: string;
  updated_at: string;
};

export type StartShiftRequest = {
  qr_token?: string | null;
  geo?: GeoCaptureRequest | null;
  notes?: string | null;
};

export type EndShiftRequest = {
  geo?: GeoCaptureRequest | null;
  justification?: string | null;
  notes?: string | null;
  is_holiday?: boolean;
};

export type EmployeePortalSummaryResponse = {
  employee_name: string;
  employee_email: string | null;
  worksite_options: Array<{ id: string; name: string }>;
  current_shift: AttendanceRequestResponse | null;
  pending_requests: AttendanceRequestResponse[];
  approved_entries: TimeEntryResponse[];
  month_extra_cost: number;
  month_hours: number;
};

export type AttendanceApprovalDecisionRequest = {
  comment: string;
};

export type CostProjectionResponse = {
  month_label: string;
  actual_extra_cost: number;
  pending_extra_cost: number;
  projected_month_end_extra_cost: number;
  approved_hours: number;
  pending_hours: number;
};

export type PayrollConnectorUpsertRequest = {
  name: string;
  provider: string;
  endpoint_url: string;
  auth_token?: string | null;
  payload_format?: "json" | "csv";
  is_active?: boolean;
};

export type PayrollConnectorResponse = {
  id: string;
  company_id: string;
  name: string;
  provider: string;
  endpoint_url: string;
  payload_format: string;
  is_active: boolean;
  last_delivery_at: string | null;
  last_delivery_status: string | null;
  last_delivery_error: string | null;
  created_at: string;
  updated_at: string;
};

export type ConnectorDispatchResponse = {
  connector_id: string;
  status: string;
  detail: string;
};

export type ReportFilters = {
  start_date?: string;
  end_date?: string;
  employee_id?: string;
  area?: string;
  legal_alert?: boolean;
};

export type TimeEntryFilters = ReportFilters;

function buildQueryString(filters: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "") {
      continue;
    }
    params.set(key, String(value));
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

async function fetchApiText(path: string): Promise<string> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
  });
  const body = await response.text();

  if (!response.ok) {
    throw new ApiResponseError(
      `La API respondio con ${response.status} en ${response.url}.`,
      response.status,
      body,
    );
  }

  return body;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  return fetchJson<LoginResponse>(`${apiBaseUrl}/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function logout(): Promise<{ message: string }> {
  return fetchJson<{ message: string }>(`${apiBaseUrl}/v1/auth/logout`, {
    method: "POST",
  });
}

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  return fetchJson<AuthenticatedUser>(`${apiBaseUrl}/v1/auth/me`);
}

export async function refreshSession(): Promise<LoginResponse> {
  return fetchJson<LoginResponse>(`${apiBaseUrl}/v1/auth/refresh`, {
    method: "POST",
  });
}

export async function getCompanyProfile(): Promise<CompanyResponse> {
  return fetchJson<CompanyResponse>(`${apiBaseUrl}/v1/company`);
}

export async function updateCompanyProfile(
  payload: CompanyUpsertRequest,
): Promise<CompanyResponse> {
  return fetchJson<CompanyResponse>(`${apiBaseUrl}/v1/company`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function listEmployees(filters?: {
  search?: string;
  status?: EmployeeStatus;
}): Promise<EmployeeResponse[]> {
  const query = buildQueryString({
    search: filters?.search,
    status: filters?.status,
  });

  return fetchJson<EmployeeResponse[]>(`${apiBaseUrl}/v1/employees${query}`);
}

export async function createEmployee(
  payload: EmployeeCreateRequest,
): Promise<EmployeeResponse> {
  return fetchJson<EmployeeResponse>(`${apiBaseUrl}/v1/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function updateEmployee(
  employeeId: string,
  payload: EmployeeUpdateRequest,
): Promise<EmployeeResponse> {
  return fetchJson<EmployeeResponse>(`${apiBaseUrl}/v1/employees/${employeeId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function enableEmployeePortalAccess(
  employeeId: string,
  payload: EmployeePortalAccessRequest,
): Promise<EmployeeResponse> {
  return fetchJson<EmployeeResponse>(`${apiBaseUrl}/v1/employees/${employeeId}/portal-access`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteEmployee(employeeId: string): Promise<{ message: string }> {
  return fetchJson<{ message: string }>(`${apiBaseUrl}/v1/employees/${employeeId}`, {
    method: "DELETE",
  });
}

export async function calculateWorkday(payload: JornadaRequest): Promise<JornadaResponse> {
  return fetchJson<JornadaResponse>(`${apiBaseUrl}/v1/jornada/calcular`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function listTimeEntries(
  filters?: TimeEntryFilters,
): Promise<TimeEntryResponse[]> {
  const query = buildQueryString(filters ?? {});
  return fetchJson<TimeEntryResponse[]>(`${apiBaseUrl}/v1/time-entries${query}`);
}

export async function createTimeEntry(
  payload: TimeEntryCreateRequest,
): Promise<TimeEntryResponse> {
  return fetchJson<TimeEntryResponse>(`${apiBaseUrl}/v1/time-entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function updateTimeEntry(
  entryId: string,
  payload: TimeEntryUpdateRequest,
): Promise<TimeEntryResponse> {
  return fetchJson<TimeEntryResponse>(`${apiBaseUrl}/v1/time-entries/${entryId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteTimeEntry(entryId: string): Promise<{ message: string }> {
  return fetchJson<{ message: string }>(`${apiBaseUrl}/v1/time-entries/${entryId}`, {
    method: "DELETE",
  });
}

export async function importTimeEntries(
  file: File,
  options?: {
    createMissingEmployees?: boolean;
    mapping?: Record<string, string>;
  },
): Promise<TimeEntryImportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "create_missing_employees",
    options?.createMissingEmployees ? "true" : "false",
  );
  if (options?.mapping && Object.keys(options.mapping).length > 0) {
    formData.append("mapping", JSON.stringify(options.mapping));
  }

  return fetchJson<TimeEntryImportResponse>(`${apiBaseUrl}/v1/time-entries/import`, {
    method: "POST",
    body: formData,
  });
}

export async function downloadImportErrors(path: string): Promise<string> {
  return fetchApiText(path.startsWith("/api") ? path.slice("/api".length) : path);
}

export async function getReports(filters?: ReportFilters): Promise<ReportResponse> {
  const query = buildQueryString(filters ?? {});
  return fetchJson<ReportResponse>(`${apiBaseUrl}/v1/reports${query}`);
}

export async function downloadReportCsv(filters?: ReportFilters): Promise<string> {
  const query = buildQueryString(filters ?? {});
  return fetchApiText(`/v1/reports/export.csv${query}`);
}

export async function downloadReportJson(filters?: ReportFilters): Promise<string> {
  const query = buildQueryString(filters ?? {});
  return fetchApiText(`/v1/reports/export.json${query}`);
}

export async function listAuditEvents(limit = 100): Promise<AuditEventResponse[]> {
  const query = buildQueryString({ limit });
  return fetchJson<AuditEventResponse[]>(`${apiBaseUrl}/v1/audit-events${query}`);
}

export async function listJurisdictions(): Promise<JurisdictionOption[]> {
  return fetchJson<JurisdictionOption[]>(`${apiBaseUrl}/v1/catalogs/jurisdictions`);
}

export async function listWorksites(): Promise<WorksiteResponse[]> {
  return fetchJson<WorksiteResponse[]>(`${apiBaseUrl}/v1/worksites`);
}

export async function createWorksite(
  payload: WorksiteCreateRequest,
): Promise<WorksiteResponse> {
  return fetchJson<WorksiteResponse>(`${apiBaseUrl}/v1/worksites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function createWorksiteQrToken(
  worksiteId: string,
  payload: WorksiteQrTokenCreateRequest = {},
): Promise<WorksiteQrTokenResponse> {
  return fetchJson<WorksiteQrTokenResponse>(`${apiBaseUrl}/v1/worksites/${worksiteId}/qr-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getEmployeePortalSummary(): Promise<EmployeePortalSummaryResponse> {
  return fetchJson<EmployeePortalSummaryResponse>(`${apiBaseUrl}/v1/self-service/summary`);
}

export async function startEmployeeShift(
  payload: StartShiftRequest,
): Promise<AttendanceRequestResponse> {
  return fetchJson<AttendanceRequestResponse>(`${apiBaseUrl}/v1/self-service/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function endEmployeeShift(
  payload: EndShiftRequest,
): Promise<AttendanceRequestResponse> {
  return fetchJson<AttendanceRequestResponse>(`${apiBaseUrl}/v1/self-service/end`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function listAttendanceRequests(status?: string): Promise<AttendanceRequestResponse[]> {
  const query = buildQueryString({ status });
  return fetchJson<AttendanceRequestResponse[]>(`${apiBaseUrl}/v1/attendance-requests${query}`);
}

export async function approveAttendanceRequest(
  requestId: string,
  payload: AttendanceApprovalDecisionRequest,
): Promise<AttendanceRequestResponse> {
  return fetchJson<AttendanceRequestResponse>(`${apiBaseUrl}/v1/attendance-requests/${requestId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function rejectAttendanceRequest(
  requestId: string,
  payload: AttendanceApprovalDecisionRequest,
): Promise<AttendanceRequestResponse> {
  return fetchJson<AttendanceRequestResponse>(`${apiBaseUrl}/v1/attendance-requests/${requestId}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getCostProjection(month?: string): Promise<CostProjectionResponse> {
  const query = buildQueryString({ month });
  return fetchJson<CostProjectionResponse>(`${apiBaseUrl}/v1/insights/cost-projection${query}`);
}

export async function listPayrollConnectors(): Promise<PayrollConnectorResponse[]> {
  return fetchJson<PayrollConnectorResponse[]>(`${apiBaseUrl}/v1/payroll-connectors`);
}

export async function upsertPayrollConnector(
  payload: PayrollConnectorUpsertRequest,
  connectorId?: string,
): Promise<PayrollConnectorResponse> {
  const query = buildQueryString({ connector_id: connectorId });
  return fetchJson<PayrollConnectorResponse>(`${apiBaseUrl}/v1/payroll-connectors${query}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function dispatchPayrollConnector(
  connectorId: string,
  month?: string,
): Promise<ConnectorDispatchResponse> {
  const query = buildQueryString({ month });
  return fetchJson<ConnectorDispatchResponse>(
    `${apiBaseUrl}/v1/payroll-connectors/${connectorId}/dispatch${query}`,
    {
      method: "POST",
    },
  );
}
