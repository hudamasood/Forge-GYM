import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/layout/section";
import { buildMetadata } from "@/lib/seo";
import { CartView } from "./cart-view";

export const metadata: Metadata = buildMetadata({ title: "Your cart", description: "Review the items in your FORGE cart.", path: "/cart", noindex: true });

export default function CartPage() {
  return (
    <Container className="flex flex-col gap-10 py-14">
      <h1 className="text-5xl font-semibold text-bone-50">Your cart</h1>
      <Suspense>
        <CartView />
      </Suspense>
    </Container>
  );
}
