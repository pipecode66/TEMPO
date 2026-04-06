import { NextRequest, NextResponse } from "next/server";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const backendOrigin = (
  process.env.TEMPO_BACKEND_ORIGIN ?? process.env.TEMPO_BACKEND_PROXY_URL ?? ""
).replace(/\/$/, "");

function buildUpstreamUrl(request: NextRequest, path: string[]) {
  const upstreamUrl = new URL(`${backendOrigin}/${path.join("/")}`);
  upstreamUrl.search = new URL(request.url).search;
  return upstreamUrl;
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
  if (!backendOrigin) {
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
  const upstreamUrl = buildUpstreamUrl(request, path);
  const method = request.method.toUpperCase();
  const requestHeaders = buildRequestHeaders(request);

  const upstreamResponse = await fetch(upstreamUrl, {
    method,
    headers: requestHeaders,
    body:
      method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
    redirect: "manual",
  });

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
