"use client";

import { useSearchParams } from "next/navigation";
import { Info } from "lucide-react";

/** Read client-side so the memberships page itself stays statically rendered. */
export function CheckoutCancelledNotice() {
  if (useSearchParams().get("checkout") !== "cancelled") return null;
  return (
    <p role="status" className="flex max-w-xl items-center gap-2 rounded-lg border border-steel-400/40 bg-steel-600/20 px-4 py-3 text-sm text-steel-300">
      <Info className="size-4 shrink-0" aria-hidden /> Checkout cancelled — you haven&apos;t been charged. Pick a plan whenever you&apos;re ready.
    </p>
  );
}
