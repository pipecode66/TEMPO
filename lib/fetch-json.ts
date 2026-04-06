type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export class ApiResponseError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: JsonValue | string,
  ) {
    super(message);
    this.name = "ApiResponseError";
  }
}

function looksLikeHtmlDocument(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("<!doctype html") || normalized.startsWith("<html");
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    credentials: init?.credentials ?? "include",
    ...init,
  });
  const rawBody = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const looksLikeJson = contentType.includes("application/json");
  const body = rawBody.trim();

  if (!body) {
    throw new ApiResponseError(
      `La respuesta de ${response.url} llego vacia y no puede parsearse como JSON.`,
      response.status,
    );
  }

  let parsed: JsonValue | string = rawBody;
  if (looksLikeJson) {
    try {
      parsed = JSON.parse(rawBody) as JsonValue;
    } catch {
      throw new ApiResponseError(
        `La respuesta de ${response.url} no contiene JSON valido.`,
        response.status,
        rawBody.slice(0, 300),
      );
    }
  }

  if (!response.ok) {
    throw new ApiResponseError(
      `La API respondio con ${response.status} en ${response.url}.`,
      response.status,
      parsed,
    );
  }

  if (!looksLikeJson) {
    throw new ApiResponseError(
      `La respuesta de ${response.url} no es JSON. Content-Type recibido: ${contentType || "desconocido"}.`,
      response.status,
      rawBody.slice(0, 300),
    );
  }

  return parsed as T;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiResponseError) {
    if (
      typeof error.payload === "object" &&
      error.payload &&
      "error" in error.payload &&
      typeof error.payload.error === "object" &&
      error.payload.error &&
      "message" in error.payload.error &&
      typeof error.payload.error.message === "string"
    ) {
      return error.payload.error.message;
    }

    if (
      typeof error.payload === "object" &&
      error.payload &&
      "detail" in error.payload &&
      typeof error.payload.detail === "string"
    ) {
      return error.payload.detail;
    }

    if (typeof error.payload === "string" && error.payload.length > 0) {
      if (looksLikeHtmlDocument(error.payload)) {
        if (error.status === 404) {
          return "La ruta de la API no estuvo disponible. Revisa el despliegue o la configuracion de /api en Vercel.";
        }

        return "La API devolvio una respuesta HTML inesperada. Revisa el despliegue del backend y la configuracion del proxy.";
      }

      return error.payload;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error inesperado al contactar la API.";
}
