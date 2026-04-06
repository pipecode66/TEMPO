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
  const candidateOrigins = getCandidateOrigins();

  if (candidateOrigins.length === 0) {
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
  const requestBody =
    method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  let upstreamResponse: Response | null = null;

  for (const candidateOrigin of candidateOrigins) {
    const upstreamUrl = buildUpstreamUrl(candidateOrigin, request, path);
    const response = await fetch(upstreamUrl, {
      method,
      headers: requestHeaders,
      body: requestBody,
      cache: "no-store",
      redirect: "manual",
    });

    upstreamResponse = response;
    if (response.status !== 404) {
      break;
    }
  }

  if (!upstreamResponse) {
    return NextResponse.json(
      {
        error: {
          code: "backend_unreachable",
          message: "No fue posible contactar el backend configurado para Tempo.",
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
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
export const HEAD = proxyRequest;
