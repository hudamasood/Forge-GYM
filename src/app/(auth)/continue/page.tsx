import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PROTECTED_ROUTES, homeForRole } from "@/auth.config";
import { safeCallbackUrl } from "@/lib/safe-redirect";

/** Post-login hop: sends the user to their requested page if their role may open it, else their portal. */
export default async function ContinuePage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl);
  const path = callbackUrl?.split(/[?#]/)[0];
  const rule = path && PROTECTED_ROUTES.find((r) => path === r.prefix || path.startsWith(`${r.prefix}/`));
  const allowed = callbackUrl && (!rule || rule.roles.includes(role));

  redirect(allowed ? callbackUrl : homeForRole(role));
}
