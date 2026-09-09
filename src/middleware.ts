import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getOrCreateRequestId, CORRELATION_HEADER } from "@/lib/correlation";

const PUBLIC_API_ROUTES = [
  "/api/auth",
  "/api/candidate/register",
  "/api/cron",
  "/api/documents",
  "/api/feedback/consent",
];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role;
    const pathname = req.nextUrl.pathname;
    const requestId = getOrCreateRequestId(req);

    // Proteção de APIs internas com JSON 401
    if (pathname.startsWith("/api/")) {
      const isPublic = PUBLIC_API_ROUTES.some((p) => pathname.startsWith(p));
      if (!isPublic && !token) {
        const res = NextResponse.json(
          { error: "Não autorizado: Sessão ausente ou inválida." },
          { status: 401 }
        );
        res.headers.set(CORRELATION_HEADER, requestId);
        return res;
      }
      const res = NextResponse.next();
      res.headers.set(CORRELATION_HEADER, requestId);
      return res;
    }

    // 1. CANDIDATO: Bloqueia acesso a qualquer área interna corporativa
    if (role === "CANDIDATE") {
      if (!pathname.startsWith("/carreiras")) {
        const res = NextResponse.redirect(
          new URL("/carreiras/maitre/candidato", req.url)
        );
        res.headers.set(CORRELATION_HEADER, requestId);
        return res;
      }
      const res = NextResponse.next();
      res.headers.set(CORRELATION_HEADER, requestId);
      return res;
    }

    // 2. HIRING_MANAGER: Acesso estrito a /portal-gestor e /jobs (suas vagas)
    if (role === "HIRING_MANAGER") {
      const allowedPrefixes = ["/portal-gestor", "/jobs", "/settings/profile"];
      const isAllowed = allowedPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
      if (!isAllowed) {
        const res = NextResponse.redirect(
          new URL("/portal-gestor", req.url)
        );
        res.headers.set(CORRELATION_HEADER, requestId);
        return res;
      }
      const res = NextResponse.next();
      res.headers.set(CORRELATION_HEADER, requestId);
      return res;
    }

    // 3. RECRUITER: Acesso operacional a R&S, candidatos, vagas e acompanhamento
    if (role === "RECRUITER") {
      if (pathname === "/") {
        const res = NextResponse.redirect(new URL("/jobs", req.url));
        res.headers.set(CORRELATION_HEADER, requestId);
        return res;
      }

      const blockedForRecruiter = [
        "/users",
        "/clients",
        "/consulting",
        "/settings/organization",
      ];
      if (blockedForRecruiter.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        const res = NextResponse.redirect(new URL("/jobs", req.url));
        res.headers.set(CORRELATION_HEADER, requestId);
        return res;
      }
      const res = NextResponse.next();
      res.headers.set(CORRELATION_HEADER, requestId);
      return res;
    }

    // 4. ADMIN e SUPER_ADMIN: Permite acesso
    const res = NextResponse.next();
    res.headers.set(CORRELATION_HEADER, requestId);
    return res;
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;
        if (pathname.startsWith("/api/")) {
          // Permite que o middleware avalie rotas de API para emitir JSON 401 em vez de redirect HTML
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/portal-gestor/:path*",
    "/jobs/:path*",
    "/candidates/:path*",
    "/feedbacks/:path*",
    "/employees/:path*",
    "/operations/:path*",
    "/insights/:path*",
    "/development/:path*",
    "/learning/:path*",
    "/culture/:path*",
    "/careers-hub/:path*",
    "/consulting/:path*",
    "/clients/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/api/:path*",
  ],
};
