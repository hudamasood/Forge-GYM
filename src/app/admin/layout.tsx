import type { Metadata } from "next";
import { PortalShell } from "@/components/layout/portal-shell";
import type { PortalNavItem } from "@/components/layout/portal-nav";
import { requirePageUser } from "@/server/http/session";

export const metadata: Metadata = { title: "Admin | FORGE", robots: { index: false, follow: false } };

const NAV: PortalNavItem[] = [
  { href: "/admin", label: "Overview", icon: "home", exact: true },
  { href: "/admin/members", label: "Members", icon: "members" },
  { href: "/admin/memberships", label: "Memberships", icon: "membership" },
  { href: "/admin/access-objects", label: "Access Objects", icon: "objects" },
  { href: "/admin/classes", label: "Classes", icon: "classes" },
  { href: "/admin/schedule", label: "Schedule", icon: "schedule" },
  { href: "/admin/trainers", label: "Trainers", icon: "profile" },
  { href: "/admin/spaces", label: "Spaces", icon: "attendance" },
  { href: "/admin/bookings", label: "Bookings", icon: "bookings" },
  { href: "/admin/products", label: "Products", icon: "products" },
  { href: "/admin/orders", label: "Orders", icon: "orders" },
  { href: "/admin/analytics", label: "Analytics", icon: "analytics" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser(["ADMIN"], "/admin");
  return (
    <PortalShell title="Admin" user={user} nav={NAV}>
      {children}
    </PortalShell>
  );
}
