import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/server/domain/types";

/** Route prefixes and the roles allowed to open them. Enforced again server-side on every request. */
export const PROTECTED_ROUTES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/trainer", roles: ["TRAINER", "ADMIN"] },
  { prefix: "/dashboard", roles: ["MEMBER", "TRAINER", "ADMIN"] },
  { prefix: "/checkout", roles: ["MEMBER", "TRAINER", "ADMIN"] },
];

export const AUTH_PAGES = ["/login", "/signup", "/forgot", "/reset-password"];

export function homeForRole(role: Role) {
  return role === "ADMIN" ? "/admin" : role === "TRAINER" ? "/trainer" : "/dashboard";
}

/**
 * Edge-safe Auth.js config shared by middleware and the full server config.
 * No database or bcrypt imports here.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname, search } = request.nextUrl;
      const role = auth?.user?.role;

      if (role && AUTH_PAGES.some((p) => pathname.startsWith(p))) {
        return Response.redirect(new URL(homeForRole(role), request.nextUrl));
      }

      const rule = PROTECTED_ROUTES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
      if (!rule) return true;
      if (!role) {
        const login = new URL("/login", request.nextUrl);
        login.searchParams.set("callbackUrl", pathname + search);
        return Response.redirect(login);
      }
      if (!rule.roles.includes(role)) return Response.redirect(new URL(homeForRole(role), request.nextUrl));
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
