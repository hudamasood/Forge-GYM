import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { logoutAction } from "@/app/(auth)/actions";
import { PortalNav, type PortalNavItem } from "./portal-nav";

/** Shared chrome for the Member, Trainer and Admin portals. */
export function PortalShell({
  title,
  user,
  nav,
  children,
}: {
  title: string;
  user: { name: string; email: string };
  nav: PortalNavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-bone-50/8 bg-ink-950 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:px-6 lg:py-6">
          <Logo />
          <span className="rounded-full border border-ember-400/40 bg-ember-500/10 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-ember-300">{title}</span>
        </div>
        <PortalNav items={nav} />
        <div className="mt-auto hidden border-t border-bone-50/8 p-5 lg:block">
          <p className="truncate text-sm font-medium text-bone-50">{user.name}</p>
          <p className="truncate text-xs text-ink-300">{user.email}</p>
          <div className="mt-4 flex items-center gap-2">
            <Link href="/" className="rounded-md px-2 py-1.5 text-sm text-ink-300 hover:bg-bone-50/5 hover:text-bone-50">
              View site
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-ink-300 hover:bg-bone-50/5 hover:text-bone-50">
                <LogOut className="size-4" aria-hidden /> Log out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-bone-50/8 px-5 py-3 lg:hidden">
          <p className="truncate text-sm text-bone-200">{user.name}</p>
          <form action={logoutAction}>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-ink-300 hover:text-bone-50">
              <LogOut className="size-4" aria-hidden /> Log out
            </button>
          </form>
        </div>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PortalHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold text-bone-50 sm:text-5xl">{title}</h1>
        {description && <p className="max-w-2xl text-ink-300">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "default" | "ember" | "warning" }) {
  return (
    <div
      className={
        tone === "ember"
          ? "rounded-2xl border border-ember-400/30 bg-ember-500/[0.08] p-5"
          : tone === "warning"
            ? "rounded-2xl border border-warning-light/30 bg-warning/10 p-5"
            : "rounded-2xl border border-bone-50/8 bg-ink-800/60 p-5"
      }
    >
      <p className="text-xs uppercase tracking-[0.16em] text-ink-300">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-bone-50">{value}</p>
      {hint && <p className="mt-1 text-sm text-ink-300">{hint}</p>}
    </div>
  );
}
