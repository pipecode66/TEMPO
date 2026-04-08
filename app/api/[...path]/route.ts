import { NextRequest, NextResponse } from "next/server";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const backendOrigin = (
  process.env.TEMPO_BACKEND_ORIGIN ?? process.env.TEMPO_BACKEND_PROXY_URL ?? ""
).replace(/\/$/, "");

function buildUpstreamUrl(origin: string, request: NextRequest, path: string[]) {
  const upstreamUrl = new URL(`${origin}/${path.join("/")}`);
  upstreamUrl.search = new URL(request.url).search;
  return upstreamUrl;
}

function getCandidateOrigins() {
  if (!backendOrigin) {
    return [];
  }

  const normalized = new URL(backendOrigin);
  const basePath = normalized.pathname.replace(/\/$/, "");

  if (basePath === "/api") {
    return [backendOrigin];
  }

  if (!basePath || basePath === "/") {
    return [backendOrigin, `${backendOrigin}/api`];
  }

  return [backendOrigin];
}

function buildRequestHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);
  const requestUrl = new URL(request.url);

  headers.delete("host");
  headers.delete("content-length");
  headers.set("x-forwarded-host", requestUrl.host);
  headers.set("x-forwarded-proto", requestUrl.protocol.replace(":", ""));

  return headers;
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const candidateOrigins = getCandidateOrigins();

    if (candidateOrigins.length === 0) {
      console.error("[API Proxy] TEMPO_BACKEND_ORIGIN not configured. Current value:", backendOrigin);
      return NextResponse.json(
        {
          error: {
            code: "backend_origin_not_configured",
            message:
              "Tempo no tiene configurado el backend productivo. Define TEMPO_BACKEND_ORIGIN en Vercel.",
          },
        },
        { status: 503 },
      );
    }

    const { path } = await context.params;
    const method = request.method.toUpperCase();
    const requestHeaders = buildRequestHeaders(request);
    
    let requestBody: ArrayBuffer | undefined;
    try {
      requestBody =
        method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
    } catch (bodyError) {
      console.error("[API Proxy] Error reading request body:", bodyError);
      requestBody = undefined;
    }

    let upstreamResponse: Response | null = null;
    let lastError: Error | null = null;

    for (const candidateOrigin of candidateOrigins) {
      const upstreamUrl = buildUpstreamUrl(candidateOrigin, request, path);
      console.log("[API Proxy] Attempting fetch to:", upstreamUrl.toString());
      
      try {
        const response = await fetch(upstreamUrl, {
          method,
          headers: requestHeaders,
          body: requestBody,
          cache: "no-store",
          redirect: "manual",
        });

        upstreamResponse = response;
        console.log("[API Proxy] Response status:", response.status);
        
        if (response.status !== 404) {
          break;
        }
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
        console.error("[API Proxy] Fetch error for", upstreamUrl.toString(), ":", lastError.message);
      }
    }

    if (!upstreamResponse) {
      console.error("[API Proxy] All candidate origins failed. Last error:", lastError?.message);
      return NextResponse.json(
        {
          error: {
            code: "backend_unreachable",
            message: "No fue posible contactar el backend configurado para Tempo.",
            details: lastError?.message,
          },
        },
        { status: 502 },
      );
    }

    const responseHeaders = new Headers(upstreamResponse.headers);
    const setCookies =
      typeof upstreamResponse.headers.getSetCookie === "function"
        ? upstreamResponse.headers.getSetCookie()
        : [];

    responseHeaders.delete("content-length");
    responseHeaders.delete("set-cookie");
    responseHeaders.set("cache-control", "no-store, max-age=0");

    for (const cookie of setCookies) {
      responseHeaders.append("set-cookie", cookie);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[API Proxy] Unhandled error:", error);
    return NextResponse.json(
      {
        error: {
          code: "proxy_error",
          message: "Error interno en el proxy de Tempo.",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
export const HEAD = proxyRequest;
