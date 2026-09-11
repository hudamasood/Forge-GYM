"use client";

import * as React from "react";
import { useCart } from "@/components/store/cart-context";

export interface PricedLine {
  productId: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  quantity: number;
  lineTotal: number;
  available: boolean;
}

type State = { status: "loading" | "ready" | "error"; items: PricedLine[]; subtotal: number };

/** Re-prices the local cart against the server whenever it changes. The server is the source of truth for price and stock. */
export function usePricedCart() {
  const { lines, ready } = useCart();
  const [state, setState] = React.useState<State>({ status: "loading", items: [], subtotal: 0 });
  const [attempt, setAttempt] = React.useState(0);
  const key = JSON.stringify(lines.map((l) => [l.productId, l.quantity]));

  React.useEffect(() => {
    if (!ready) return;
    if (lines.length === 0) {
      setState({ status: "ready", items: [], subtotal: 0 });
      return;
    }
    const controller = new AbortController();
    setState((s) => ({ ...s, status: s.items.length ? "ready" : "loading" }));
    fetch("/api/cart/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("pricing failed");
        const body = (await res.json()) as { items: PricedLine[]; subtotal: number };
        setState({ status: "ready", items: body.items, subtotal: body.subtotal });
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") setState((s) => ({ ...s, status: "error" }));
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
