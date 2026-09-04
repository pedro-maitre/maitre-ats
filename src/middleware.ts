import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role;
    const pathname = req.nextUrl.pathname;

    // 1. CANDIDATO: Bloqueia acesso a qualquer área interna corporativa
    if (role === "CANDIDATE") {
      if (!pathname.startsWith("/carreiras")) {
        return NextResponse.redirect(
          new URL("/carreiras/maitre/candidato", req.url)
        );
      }
      return;
    }

    // 2. HIRING_MANAGER: Acesso estrito a /portal-gestor e /jobs (suas vagas)
    if (role === "HIRING_MANAGER") {
      const allowedPrefixes = ["/portal-gestor", "/jobs", "/settings/profile"];
      const isAllowed = allowedPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
      if (!isAllowed) {
        return NextResponse.redirect(
          new URL("/portal-gestor", req.url)
        );
      }
      return;
    }

    // 3. RECRUITER: Acesso operacional a R&S, candidatos, vagas e acompanhamento
    // Bloqueia áreas estritamente administrativas/executivas: /users, /clients, /consulting, /settings/organization
    if (role === "RECRUITER") {
      // Se acessar a raiz (Painel Executivo Geral com folha/auditorias), direciona para /jobs
      if (pathname === "/") {
        return NextResponse.redirect(new URL("/jobs", req.url));
      }

      const blockedForRecruiter = [
        "/users",
        "/clients",
        "/consulting",
        "/settings/organization",
      ];
      if (blockedForRecruiter.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return NextResponse.redirect(new URL("/jobs", req.url));
      }
      return;
    }

    // 4. ADMIN e SUPER_ADMIN têm acesso às rotas internas corporativas
  },
  {
    secret: process.env.NEXTAUTH_SECRET || "maitre-ats-production-secret-key-123",
    callbacks: {
      authorized: ({ token }) => !!token,
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
  ],
};
