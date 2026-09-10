"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/toast";
import { CartProvider } from "@/components/store/cart-context";

/**
 * Client providers. The session is read client-side so public pages stay
 * statically renderable (ISR) instead of turning dynamic by reading cookies.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <CartProvider>{children}</CartProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
