import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="grain relative flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden px-6 text-center">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_40%,rgba(194,65,12,0.25),transparent_70%)]" />
      <Logo />
      <p aria-hidden className="font-display text-[clamp(7rem,22vw,14rem)] font-bold leading-none text-bone-50/10">404</p>
      <div className="-mt-10 flex flex-col gap-3">
        <h1 className="text-4xl font-semibold text-bone-50 sm:text-5xl">This page skipped leg day</h1>
        <p className="mx-auto max-w-md text-ink-300">We couldn&apos;t find what you were looking for. It may have moved, or the link might be wrong.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/classes">Browse classes</Link>
        </Button>
      </div>
    </main>
  );
}
