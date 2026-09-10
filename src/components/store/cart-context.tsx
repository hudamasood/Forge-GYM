"use client";

import * as React from "react";

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  category: string;
  /** Display-only snapshot; the server re-prices every cart at checkout. */
  price: number;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "forge-cart-v1";
export const MAX_QUANTITY = 10;

const CartContext = React.createContext<CartContextValue | null>(null);

function read(): CartLine[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((l) => typeof l?.productId === "string" && Number.isInteger(l?.quantity)) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setLines(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setLines(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // storage unavailable (private mode) — cart still works for this tab
    }
  }, [lines, ready]);

  const value = React.useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => n + l.quantity * l.price, 0),
      add: (line, quantity = 1) =>
        setLines((all) => {
          const existing = all.find((l) => l.productId === line.productId);
          if (existing) return all.map((l) => (l.productId === line.productId ? { ...l, ...line, quantity: Math.min(MAX_QUANTITY, l.quantity + quantity) } : l));
          return [...all, { ...line, quantity: Math.min(MAX_QUANTITY, quantity) }];
        }),
      setQuantity: (productId, quantity) =>
        setLines((all) =>
          quantity <= 0 ? all.filter((l) => l.productId !== productId) : all.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(MAX_QUANTITY, quantity) } : l)),
        ),
      remove: (productId) => setLines((all) => all.filter((l) => l.productId !== productId)),
      clear: () => setLines([]),
    }),
    [lines, ready],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
