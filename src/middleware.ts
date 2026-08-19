import { withAuth } from "next-auth/middleware";
export default withAuth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/jobs/:path*",
    "/candidates/:path*",
    "/settings/:path*",
  ],
};
