import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="grain relative hidden overflow-hidden border-r border-bone-50/8 bg-ink-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_20%_20%,rgba(221,90,34,0.35),transparent_70%),radial-gradient(50%_50%_at_90%_90%,rgba(74,85,96,0.35),transparent_70%)]" />
        <Logo />
        <div className="flex flex-col gap-6">
          <p className="font-display text-7xl font-semibold uppercase leading-[0.95] text-bone-50 xl:text-8xl">
            Strength
            <br />
            is made,
            <br />
            <span className="text-ember-400">not born.</span>
          </p>
          <p className="max-w-sm text-ink-300">Six dedicated spaces. Coaches who care about your form. Memberships built around how you actually train.</p>
        </div>
        <p className="text-xs text-ink-400">© {new Date().getFullYear()} FORGE</p>
      </aside>
      <main id="main" className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link href="/" className="ml-auto inline-flex items-center gap-2 rounded-md text-sm text-ink-300 transition-colors hover:text-bone-50">
            <ArrowLeft className="size-4" aria-hidden /> Back to site
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">{children}</div>
      </main>
    </div>
  );
}
