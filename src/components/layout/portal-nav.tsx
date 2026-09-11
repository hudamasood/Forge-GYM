"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Box,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Dumbbell,
  Home,
  Package,
  ReceiptText,
  ScrollText,
  ShoppingBag,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Icons are referenced by name so server components can pass nav config across the client boundary. */
const ICONS = {
  home: Home,
  membership: CreditCard,
  bookings: CalendarCheck,
  orders: ReceiptText,
  profile: User,
  schedule: CalendarDays,
  classes: Dumbbell,
  attendance: ClipboardList,
  members: Users,
  objects: Box,
  products: Package,
  store: ShoppingBag,
  analytics: BarChart3,
  audit: ScrollText,
} satisfies Record<string, LucideIcon>;

export interface PortalNavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  exact?: boolean;
}

export function PortalNav({ items }: { items: PortalNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Portal" className="overflow-x-auto px-3 pb-3 lg:overflow-visible lg:pb-0">
      <ul className="flex w-max gap-1 lg:w-auto lg:flex-col">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-ember-500/15 text-ember-100" : "text-bone-200 hover:bg-bone-50/5 hover:text-bone-50",
                )}
              >
                <Icon className={cn("size-4", active ? "text-ember-400" : "text-ink-300")} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
