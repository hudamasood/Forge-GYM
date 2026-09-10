"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-context";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { href: "/classes", label: "Classes" },
  { href: "/trainers", label: "Trainers" },
  { href: "/memberships", label: "Memberships" },
  { href: "/spaces", label: "Spaces" },
  { href: "/store", label: "Store" },
  { href: "/contact", label: "Contact" },
];

export interface HeaderUser {
  name: string;
  role: "MEMBER" | "TRAINER" | "ADMIN";
}

export function portalHref(role: HeaderUser["role"]) {
  return role === "ADMIN" ? "/admin" : role === "TRAINER" ? "/trainer" : "/dashboard";
}

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const user: HeaderUser | null = session?.user ? { name: session.user.name ?? "", role: session.user.role } : null;
  const { count, ready } = useCart();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);
  // Re-read the session after navigations so a login/logout elsewhere is reflected.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => void update(), [pathname]);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled || open ? "border-bone-50/8 bg-ink-900/85 backdrop-blur-xl" : "border-transparent bg-transparent",
      )}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ember-500 focus:px-4 focus:py-2 focus:text-bone-50">
        Skip to content
      </a>
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium text-bone-200 transition-colors hover:text-bone-50",
                "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-ember-400 after:transition-transform after:duration-300 hover:after:scale-x-100",
                isActive(link.href) && "text-bone-50 after:scale-x-100",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative grid size-10 place-items-center rounded-lg text-bone-100 transition-colors hover:bg-bone-50/5 hover:text-bone-50"
            aria-label={`Cart${ready && count ? `, ${count} item${count === 1 ? "" : "s"}` : ""}`}
          >
            <ShoppingBag className="size-5" aria-hidden />
            {ready && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-ember-500 px-1 text-[11px] font-semibold text-bone-50">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
              <Link href={portalHref(user.role)}>{user.role === "MEMBER" ? "My account" : user.role === "TRAINER" ? "Trainer portal" : "Admin"}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/memberships">Join now</Link>
              </Button>
            </>
          )}
          <button
            type="button"
            className="grid size-10 place-items-center rounded-lg text-bone-100 hover:bg-bone-50/5 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      <div id="mobile-nav" hidden={!open} className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-bone-50/8 bg-ink-900 px-5 pb-10 pt-4 lg:hidden">
        <nav aria-label="Mobile" className="flex flex-col">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              style={{ animationDelay: `${i * 40}ms` }}
              className={cn(
                "animate-fade-up border-b border-bone-50/6 py-4 font-display text-3xl uppercase tracking-wide text-bone-100",
                isActive(link.href) && "text-ember-400",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 flex flex-col gap-3">
          {user ? (
            <Button asChild variant="secondary" size="lg">
              <Link href={portalHref(user.role)}>Go to my portal</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/memberships">Join now</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/login">Log in</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
