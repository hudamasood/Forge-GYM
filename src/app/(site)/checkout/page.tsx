import type { Metadata } from "next";
import { Container } from "@/components/layout/section";
import { requirePageUser } from "@/server/http/session";
import { buildMetadata } from "@/lib/seo";
import { CheckoutView } from "./checkout-view";

export const metadata: Metadata = buildMetadata({ title: "Checkout", description: "Complete your FORGE store order.", path: "/checkout", noindex: true });

export default async function CheckoutPage() {
  const user = await requirePageUser(undefined, "/checkout");
  return (
    <Container className="flex flex-col gap-10 py-14">
      <h1 className="text-5xl font-semibold text-bone-50">Checkout</h1>
      <CheckoutView email={user.email} />
    </Container>
  );
}
