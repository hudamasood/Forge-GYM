import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { devPaymentsEnabled } from "@/server/config";
import { services } from "@/server/container";
import { DevPaymentProvider } from "@/server/adapters/dev-payment-provider";
import { requirePageUser } from "@/server/http/session";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Test checkout | FORGE", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function provider() {
  const payments = services().payments;
  return devPaymentsEnabled && payments instanceof DevPaymentProvider ? payments : null;
}

async function completeTestPayment(form: FormData) {
  "use server";
  const dev = provider();
  if (!dev) notFound();
  const user = await requirePageUser();
  const pending = dev.decode(String(form.get("token") ?? ""));
  if (!pending) redirect("/?checkout=expired");
  const owner = "userId" in pending.event ? pending.event.userId : null;
  if (owner && owner !== user.id) notFound();
  await services().webhooks.apply(pending.event);
  redirect(pending.successUrl);
}

/**
 * Local-development stand-in for Stripe Checkout, used only when no Stripe
 * keys are configured and never in production. It applies exactly the event
 * the Stripe webhook would deliver.
 */
export default async function DevCheckoutPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const dev = provider();
  if (!dev) notFound();
  await requirePageUser(undefined, "/memberships");
  const token = (await searchParams).token ?? "";
  const pending = dev.decode(token);

  return (
    <main id="main" className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-bone-50/10 bg-ink-800 p-8 shadow-warm-lg">
        <Logo />
        <p className="mt-6 flex items-center gap-2 rounded-lg border border-warning-light/30 bg-warning/10 px-3 py-2 text-sm text-warning-light">
          <FlaskConical className="size-4 shrink-0" aria-hidden /> Test mode — no real payment is taken. Add Stripe keys to use real Stripe Checkout.
        </p>
        {!pending ? (
          <>
            <h1 className="mt-6 text-3xl font-semibold text-bone-50">Checkout expired</h1>
            <p className="mt-2 text-ink-300">This checkout link is invalid or has expired. Start again from the site.</p>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-3xl font-semibold text-bone-50">{pending.summary.title}</h1>
            <ul className="mt-5 flex flex-col gap-2 border-y border-bone-50/8 py-4 text-sm">
              {pending.summary.lines.map((line) => (
                <li key={line.name} className="flex justify-between gap-4 text-bone-100">
                  <span>
                    {line.quantity} × {line.name}
                  </span>
                  <span>{formatUsd(line.amount * line.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-baseline justify-between">
              <span className="text-ink-300">Total{pending.summary.recurring ? ` per ${pending.summary.recurring}` : ""}</span>
              <span className="font-display text-3xl text-bone-50">{formatUsd(pending.summary.total)}</span>
            </p>
            <form action={completeTestPayment} className="mt-6 flex flex-col gap-3">
              <input type="hidden" name="token" value={token} />
              <Button type="submit" size="lg">
                Complete test payment
              </Button>
              <Button asChild variant="ghost">
                <a href={pending.cancelUrl}>Cancel</a>
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
