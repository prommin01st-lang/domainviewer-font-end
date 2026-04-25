import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.API_PROXY_URL;

async function proxy(request: NextRequest, method: string) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: "API_PROXY_URL is not configured" },
      { status: 500 }
    );
  }

  // Build backend URL from path segments
  const path = request.nextUrl.pathname.replace(/^\/api/, "");
  const search = request.nextUrl.search;
  const url = `${BACKEND_URL}/api${path}${search}`;

  // Forward headers
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    // Skip hop-by-hop headers
    if (["host", "connection", "keep-alive", "transfer-encoding"].includes(key.toLowerCase())) {
      return;
    }
    headers.set(key, value);
  });

  // Ensure ngrok skip warning
  headers.set("ngrok-skip-browser-warning", "true");

  try {
    const body = method !== "GET" && method !== "HEAD" ? await request.arrayBuffer() : undefined;

    const response = await fetch(url, {
      method,
      headers,
      body,
      // Forward cookies
      credentials: "include",
    });

    // Build response
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Skip headers that Next.js manages
      if (["content-encoding", "transfer-encoding"].includes(key.toLowerCase())) {
        return;
      }
      responseHeaders.set(key, value);
    });

    const responseBody = await response.arrayBuffer();

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[BFF] Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxy(request, "GET");
}

export async function POST(request: NextRequest) {
  return proxy(request, "POST");
}

export async function PUT(request: NextRequest) {
  return proxy(request, "PUT");
}

export async function DELETE(request: NextRequest) {
  return proxy(request, "DELETE");
}

export async function PATCH(request: NextRequest) {
  return proxy(request, "PATCH");
}
