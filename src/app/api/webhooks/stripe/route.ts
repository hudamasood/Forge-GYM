import { NextResponse } from "next/server";
import { services } from "@/server/container";

/**
 * POST /api/webhooks/stripe — authenticated by Stripe signature only.
 * The raw body is verified before anything is trusted; processing is
 * idempotent per event id. Non-2xx responses make Stripe retry.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await request.text();
  let result;
  try {
    result = await services().webhooks.handle(rawBody, signature);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    const invalidSignature = /signature/i.test(message);
    if (!invalidSignature) console.error("[webhook] processing failed", error);
    return NextResponse.json({ error: invalidSignature ? "Invalid signature" : "Processing failed" }, { status: invalidSignature ? 400 : 500 });
  }
  return NextResponse.json({ received: true, ...result });
}
