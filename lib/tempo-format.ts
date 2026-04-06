function toDate(value: Date | string): Date {
  if (value instanceof Date) {
    return value;
  }

  if (value.includes("T")) {
    return new Date(value);
  }

  return new Date(`${value}T00:00:00`);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatHours(value: number): string {
  return `${new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 2,
  }).format(value || 0)} h`;
}

export function formatShortDate(value: Date | string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(toDate(value));
}

export function formatLongDate(value: Date | string): string {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(toDate(value));
}

export function formatShortDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(value));
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
