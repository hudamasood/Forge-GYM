import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/** First line of access control: redirects by role. Every route handler and action re-checks server-side. */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/admin/:path*", "/trainer/:path*", "/dashboard/:path*", "/checkout/:path*", "/login", "/signup", "/forgot", "/reset-password"],
};
