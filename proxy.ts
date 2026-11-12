import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // Server Actions also validate Origin. Reject absent origins and cross-site POSTs before parsing a body.
  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    try {
      const source = new URL(origin ?? "");
      if (source.host !== host || (process.env.VERCEL === "1" && source.protocol !== "https:") || request.headers.get("sec-fetch-site") === "cross-site") {
        return new NextResponse("Richiesta non autorizzata.", { status: 403 });
      }
    } catch {
      return new NextResponse("Richiesta non autorizzata.", { status: 403 });
    }
  }

  const development = process.env.NODE_ENV === "development";
  const nonce = randomBytes(18).toString("base64");
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${development ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(!development ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const forwarded = new Headers(request.headers);
  forwarded.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: forwarded } });
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/", "/accesso", "/gestione/:path*"],
};
