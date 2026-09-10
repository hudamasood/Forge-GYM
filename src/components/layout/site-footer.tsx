import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { GYM } from "@/lib/site";

const COLUMNS = [
  {
    title: "Train",
    links: [
      { href: "/classes", label: "Classes" },
      { href: "/trainers", label: "Trainers" },
      { href: "/spaces", label: "Spaces" },
      { href: "/memberships", label: "Memberships" },
    ],
  },
  {
    title: "Shop",
    links: [
      { href: "/store", label: "Store" },
      { href: "/store?category=SUPPLEMENTS", label: "Supplements" },
      { href: "/store?category=MERCHANDISE", label: "Merchandise" },
      { href: "/cart", label: "Cart" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/signup", label: "Create account" },
      { href: "/dashboard", label: "Member dashboard" },
      { href: "/contact", label: "Contact us" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-bone-50/8 bg-ink-950">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-5">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-ink-300">{GYM.tagline} Six dedicated spaces, expert coaches and memberships built around how you train.</p>
          {/* NAP — must match Google Business Profile exactly once the location is confirmed (spec C3). */}
          <address className="flex flex-col gap-1 text-sm not-italic text-bone-200">
            <span>{GYM.address.street}</span>
            <span>
              {GYM.address.city}, {GYM.address.region} {GYM.address.postalCode}
            </span>
            <a href={`tel:${GYM.phone.replace(/\s/g, "")}`} className="hover:text-ember-300">
              {GYM.phone}
            </a>
            <a href={`mailto:${GYM.email}`} className="hover:text-ember-300">
              {GYM.email}
            </a>
          </address>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="mb-4 font-display text-sm tracking-[0.2em] text-ember-400">{col.title}</h2>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-bone-200 transition-colors hover:text-bone-50">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-bone-50/6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-ink-400 sm:flex-row sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} FORGE. All rights reserved.</p>
          <p>Hours: {GYM.hours.weekdays} weekdays · {GYM.hours.weekends} weekends</p>
        </div>
      </div>
    </footer>
  );
}
