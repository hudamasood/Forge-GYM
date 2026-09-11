import type { Metadata } from "next";
import { PortalShell } from "@/components/layout/portal-shell";
import type { PortalNavItem } from "@/components/layout/portal-nav";
import { requirePageUser } from "@/server/http/session";

export const metadata: Metadata = { title: "My account | FORGE", robots: { index: false, follow: false } };

const NAV: PortalNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "home", exact: true },
  { href: "/dashboard/membership", label: "Membership", icon: "membership" },
  { href: "/dashboard/bookings", label: "Bookings", icon: "bookings" },
  { href: "/dashboard/orders", label: "Orders", icon: "orders" },
  { href: "/dashboard/profile", label: "Profile", icon: "profile" },
];

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser(undefined, "/dashboard");
  return (
    <PortalShell title="Member" user={user} nav={NAV}>
      {children}
    </PortalShell>
  );
}
