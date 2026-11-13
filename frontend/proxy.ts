import { auth } from "@/auth";
import type { AppSession } from "@/lib/session";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export default auth((req) => {
  const session = req.auth as AppSession | null;
  const pathname = req.nextUrl.pathname;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Not signed in → send to login
  if (!session) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user?.role;

  // Signed in but no role yet → send to onboarding (unless already there)
  if (!role && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
  }

  // Prevent an already-onboarded user from hitting /onboarding again
  if (role && pathname === "/onboarding") {
    return NextResponse.redirect(
      new URL(
        role === "OWNER" ? "/dashboard/owner" : "/dashboard/supplier",
        req.nextUrl.origin
      )
    );
  }

  // Role-based route guards
  if (pathname.startsWith("/dashboard/owner") && role !== "OWNER") {
    return NextResponse.redirect(new URL("/dashboard/supplier", req.nextUrl.origin));
  }
  if (pathname.startsWith("/dashboard/supplier") && role !== "SUPPLIER") {
    return NextResponse.redirect(new URL("/dashboard/owner", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
