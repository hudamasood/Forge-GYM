"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, Lock, ShoppingBag } from "lucide-react";
import { usePricedCart } from "@/components/store/use-priced-cart";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { FieldError } from "@/components/ui/form";
import { formatUsd } from "@/lib/format";

export function CheckoutView({ email }: { email: string }) {
  const priced = usePricedCart();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const blocked = priced.items.some((i) => !i.available || i.quantity === 0);

  const pay = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: priced.items.map((i) => ({ productId: i.productId, quantity: i.quantity })) }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.url) {
        window.location.assign(body.url);
        return;
      }
      setError(body.error?.message ?? "We couldn't start checkout. Please try again.");
    } catch {
      setError("Network error — check your connection and try again.");
    }
    setPending(false);
  };

  if (priced.status === "loading") return <Skeleton className="h-72" />;
  if (priced.status === "error") return <ErrorState message="We couldn't load current prices for your cart." onRetry={priced.retry} />;
  if (priced.items.length === 0) return <EmptyState icon={ShoppingBag} title="Nothing to check out" message="Your cart is empty." action={{ label: "Visit the store", href: "/store" }} />;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <section aria-labelledby="items-heading" className="rounded-2xl border border-bone-50/8 bg-ink-800/60 p-6">
        <h2 id="items-heading" className="font-display text-xl text-bone-50">
          Items
        </h2>
        <ul className="mt-4 divide-y divide-bone-50/6">
          {priced.items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-4 py-3 text-sm">
              <span className="text-bone-100">
                {i.quantity} × {i.name}
              </span>
              <span className="text-bone-50">{formatUsd(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-300">
          Receipt goes to <span className="text-bone-100">{email}</span>. Physical items: you&apos;ll enter a delivery address on the secure payment page.
        </p>
      </section>

      <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-ember-400/30 bg-ember-500/[0.06] p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-bone-100">Total (USD)</span>
          <span className="font-display text-4xl text-bone-50">{formatUsd(priced.subtotal)}</span>
        </div>
        {blocked && (
          <p className="flex items-center gap-2 text-sm text-warning-light">
            <AlertCircle className="size-4 shrink-0" aria-hidden /> Some items changed availability.{" "}
            <Link href="/cart" className="underline">
              Review cart
            </Link>
          </p>
        )}
        {error && <FieldError>{error}</FieldError>}
        <Button size="lg" onClick={pay} loading={pending} loadingText="Redirecting to payment…" disabled={blocked}>
          <Lock aria-hidden /> Pay securely
        </Button>
        <Button asChild variant="ghost">
          <Link href="/cart">Back to cart</Link>
        </Button>
      </aside>
    </div>
  );
}
