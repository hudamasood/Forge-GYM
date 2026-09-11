import type { Metadata } from "next";
import { PortalShell } from "@/components/layout/portal-shell";
import type { PortalNavItem } from "@/components/layout/portal-nav";
import { requirePageUser } from "@/server/http/session";

export const metadata: Metadata = { title: "Trainer portal | FORGE", robots: { index: false, follow: false } };

const NAV: PortalNavItem[] = [
  { href: "/trainer", label: "Overview", icon: "home", exact: true },
  { href: "/trainer/schedule", label: "Schedule", icon: "schedule" },
  { href: "/trainer/classes", label: "Classes", icon: "classes" },
  { href: "/trainer/availability", label: "Availability", icon: "bookings" },
  { href: "/trainer/attendance", label: "Attendance", icon: "attendance" },
  { href: "/trainer/profile", label: "Profile", icon: "profile" },
];

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser(["TRAINER", "ADMIN"], "/trainer");
  return (
    <PortalShell title="Trainer" user={user} nav={NAV}>
      {children}
    </PortalShell>
  );
}
