import { NextResponse } from "next/server";
import { config } from "@/server/config";
import { services } from "@/server/container";

/**
 * POST /api/webhooks/safepay — authenticated by Safepay's X-SFPY-SIGNATURE
 * (HMAC-SHA512) only. The raw body is verified before anything is trusted;
 * processing is idempotent per event token. Non-2xx responses make Safepay
 * retry, so only genuine processing failures return 500.
 */
export async function POST(request: Request) {
  if (config.paymentProvider !== "safepay") return NextResponse.json({ error: "Safepay is not the active payment provider" }, { status: 404 });

  const signature = request.headers.get("x-sfpy-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await request.text();
  let result;
  try {
    result = await services().webhooks.handle(rawBody, signature);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    const invalidSignature = /signature/i.test(message);
    if (!invalidSignature) console.error("[webhook:safepay] processing failed", error);
    return NextResponse.json({ error: invalidSignature ? "Invalid signature" : "Processing failed" }, { status: invalidSignature ? 400 : 500 });
  }
  return NextResponse.json({ received: true, ...result });
}
