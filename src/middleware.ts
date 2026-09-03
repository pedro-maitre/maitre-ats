import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/jobs",
  "/candidates",
  "/employees",
  "/operations",
  "/insights",
  "/development",
  "/learning",
  "/culture",
  "/careers-hub",
  "/consulting",
  "/clients",
  "/settings",
  "/users",
];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isCandidate = token?.role === "CANDIDATE";
    const pathname = req.nextUrl.pathname;

    // Se logado como CANDIDATO, impede o acesso ao painel do recrutador/suíte interna
    if (isCandidate && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.redirect(
        new URL("/carreiras/maitre/candidato", req.url)
      );
    }
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
    "/dashboard/:path*",
    "/jobs/:path*",
    "/candidates/:path*",
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
