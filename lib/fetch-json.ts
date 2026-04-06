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

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
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
