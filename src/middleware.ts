import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isCandidate = token?.role === "CANDIDATE";
    const pathname = req.nextUrl.pathname;

    // If logged in as CANDIDATE, prevent access to recruiter ATS dashboard
    if (
      isCandidate &&
      (pathname.startsWith("/jobs") ||
        pathname.startsWith("/candidates") ||
        pathname.startsWith("/users") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/dashboard"))
    ) {
      return NextResponse.redirect(
        new URL("/carreiras/maitre/candidato", req.url)
      );
    }
  },
  {
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
    "/settings/:path*",
    "/users/:path*",
  ],
};
