import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { ClearCart } from "./clear-cart";

export const metadata: Metadata = buildMetadata({ title: "Order confirmed", description: "Thanks for your FORGE order.", path: "/checkout/success", noindex: true });

export default function CheckoutSuccessPage() {
  return (
    <Container className="flex flex-col items-center gap-6 py-24 text-center">
      <ClearCart />
      <span className="grid size-16 place-items-center rounded-full bg-success/20 text-success-light">
        <CheckCircle2 className="size-8" aria-hidden />
      </span>
      <h1 className="text-5xl font-semibold text-bone-50">Order received</h1>
      <p className="max-w-md text-bone-200">Thanks! Your payment went through and a receipt is on its way to your inbox. Your order appears in your history once payment is confirmed.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard/orders">View my orders</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/store">Keep shopping</Link>
        </Button>
      </div>
    </Container>
  );
}
