"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { MAX_QUANTITY } from "@/components/store/cart-context";

export function QuantityStepper({ value, onChange, max, label }: { value: number; onChange: (v: number) => void; max: number; label: string }) {
  return (
    <div className="inline-flex h-11 items-center rounded-lg border border-bone-50/12 bg-ink-900" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1} className="grid size-11 place-items-center text-bone-100 hover:text-bone-50 disabled:opacity-40" aria-label="Decrease quantity">
        <Minus className="size-4" aria-hidden />
      </button>
      <output aria-live="polite" className="w-8 text-center font-medium text-bone-50">
        {value}
      </output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="grid size-11 place-items-center text-bone-100 hover:text-bone-50 disabled:opacity-40" aria-label="Increase quantity">
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function ProductPurchase({ product }: { product: { id: string; slug: string; name: string; category: string; price: number; stock: number } }) {
  const [quantity, setQuantity] = React.useState(1);
  const max = Math.max(1, Math.min(MAX_QUANTITY, product.stock));
  const soldOut = product.stock <= 0;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {!soldOut && <QuantityStepper value={quantity} onChange={setQuantity} max={max} label={`Quantity of ${product.name}`} />}
      <AddToCartButton product={product} quantity={quantity} size="lg" disabled={soldOut} className="min-w-44" />
    </div>
  );
}
