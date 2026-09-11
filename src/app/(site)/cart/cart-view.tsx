"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Info, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/store/cart-context";
import { usePricedCart } from "@/components/store/use-priced-cart";
import { QuantityStepper } from "@/components/store/product-purchase";
import { ArtPanel, CATEGORY_ICONS } from "@/components/brand/art";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { formatUsd, titleCase } from "@/lib/format";

export function CartView() {
  const { setQuantity, remove } = useCart();
  const priced = usePricedCart();
  const cancelled = useSearchParams().get("checkout") === "cancelled";
  const blocked = priced.items.some((i) => !i.available || i.quantity === 0);

  if (priced.status === "loading") {
    return (
      <div role="status" aria-label="Loading cart" className="grid gap-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }
  if (priced.status === "error") return <ErrorState message="We couldn't load current prices for your cart." onRetry={priced.retry} />;
  if (priced.items.length === 0) {
    return <EmptyState icon={ShoppingBag} title="Your cart is empty" message="Supplements, equipment and FORGE gear — all picked by our coaches." action={{ label: "Visit the store", href: "/store" }} />;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-4">
        {cancelled && (
          <p role="status" className="flex items-center gap-2 rounded-lg border border-steel-400/40 bg-steel-600/20 px-4 py-3 text-sm text-steel-300">
            <Info className="size-4 shrink-0" aria-hidden /> Checkout cancelled — your cart is saved and you haven&apos;t been charged.
          </p>
        )}
        <ul className="flex flex-col gap-4">
          {priced.items.map((item) => (
            <li key={item.productId} className="flex gap-4 rounded-2xl border border-bone-50/8 bg-ink-800/60 p-4 sm:gap-5">
              <ArtPanel seed={item.slug} icon={CATEGORY_ICONS[item.category]} className="size-24 shrink-0 rounded-xl" intensity={0.7} />
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/store/${item.slug}`} className="font-medium text-bone-50 hover:text-ember-300">
                      {item.name}
                    </Link>
                    <p className="text-xs uppercase tracking-wider text-ink-300">{titleCase(item.category)}</p>
                  </div>
                  <p className="font-display text-xl text-bone-50">{formatUsd(item.lineTotal)}</p>
                </div>
                {!item.available && (
                  <p className="flex items-center gap-1.5 text-sm text-warning-light">
                    <AlertCircle className="size-4" aria-hidden /> {item.stock <= 0 ? "Sold out — remove to continue" : `Only ${item.stock} left — quantity adjusted`}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between gap-3">
                  {item.stock > 0 ? (
                    <QuantityStepper value={item.quantity} onChange={(q) => setQuantity(item.productId, q)} max={Math.min(10, item.stock)} label={`Quantity of ${item.name}`} />
                  ) : (
                    <span />
                  )}
                  <Button variant="ghost" size="sm" onClick={() => remove(item.productId)} aria-label={`Remove ${item.name}`}>
                    <Trash2 aria-hidden /> Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-bone-50/8 bg-ink-800/60 p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl text-bone-50">Order summary</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-300">Subtotal</dt>
            <dd className="text-bone-50">{formatUsd(priced.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-300">Shipping & tax</dt>
            <dd className="text-bone-200">Calculated at checkout</dd>
          </div>
        </dl>
        <div className="flex items-baseline justify-between border-t border-bone-50/8 pt-4">
          <span className="text-bone-100">Total</span>
          <span className="font-display text-3xl text-bone-50">{formatUsd(priced.subtotal)}</span>
        </div>
        <Button asChild size="lg" className={blocked ? "pointer-events-none opacity-50" : undefined} aria-disabled={blocked}>
          <Link href="/checkout" tabIndex={blocked ? -1 : undefined}>
            Checkout <ArrowRight aria-hidden />
          </Link>
        </Button>
        <p className="text-center text-xs text-ink-300">Prices in USD. Payment handled securely by Stripe.</p>
      </aside>
    </div>
  );
}
