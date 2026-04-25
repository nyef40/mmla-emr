// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin-only routes: require admin role → 403 (except forms-overview, allowed for all)
    if (path.startsWith("/admin") && !path.startsWith("/admin/forms-overview")) {
      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/403", req.url));
      }
    }

    // Patient edit: allow admin, staff, rn, pt → 403 if not allowed
    if (path.startsWith("/patients") && path.includes("/edit")) {
      const allowedRoles = ["admin", "staff", "rn", "pt"];
      if (!allowedRoles.includes(token?.role as string)) {
        return NextResponse.redirect(new URL("/403", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/home/:path*",
    "/dashboard/:path*",
    "/patients/:path*",
    "/appointments/:path*",
    "/admin/:path*",
    "/libraries/:path*",
  ],
};