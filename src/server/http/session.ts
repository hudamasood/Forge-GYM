import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { homeForRole } from "@/auth.config";
import { ForbiddenError, UnauthorizedError } from "@/server/domain/errors";
import type { Role } from "@/server/domain/types";

export interface SessionUser {
  id: string;
  role: Role;
  name: string;
  email: string;
}

export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: session.user.role, name: session.user.name ?? "", email: session.user.email ?? "" };
}

/** For Server Components / pages: redirects instead of throwing. */
export async function requirePageUser(roles?: Role[], callbackUrl?: string): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect(`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
  if (roles && !roles.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}

/** For Route Handlers and Server Actions: the role is re-checked server-side on every request (spec B5). */
export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new UnauthorizedError("Please log in to continue");
  if (roles && !roles.includes(user.role)) throw new ForbiddenError("You do not have access to this resource");
  return user;
}
