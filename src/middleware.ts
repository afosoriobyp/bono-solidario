import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as { rol?: string } | null;
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/admin") && token?.rol !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname.startsWith("/vendedor") && !["admin", "vendedor"].includes(token?.rol || "")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: ["/admin/:path*", "/vendedor/:path*", "/perfil/:path*"]
};