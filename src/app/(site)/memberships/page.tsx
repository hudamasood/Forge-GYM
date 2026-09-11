import type { Metadata } from "next";
import { Suspense } from "react";
import { Check, Minus } from "lucide-react";
import { services } from "@/server/container";
import { Container, PageHero, Section, SectionHeading } from "@/components/layout/section";
import { PlanGrid } from "@/components/membership/plan-grid";
import { CheckoutCancelledNotice } from "@/components/membership/checkout-notice";
import { ObjectIcon } from "@/components/brand/art";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";
import { formatUsd } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Memberships",
  category: "Pricing",
  description: "FORGE gym membership pricing: six single-space plans from $35/month or Premium All-Access for every space. Save two months with annual billing.",
  path: "/memberships",
});

const FAQ = [
  {
    q: "Are classes included with my membership?",
    a: "Yes. Every class in the spaces your plan covers is included — a Yoga Unlimited member books any Yoga Studio class, and All-Access members book every class in every space.",
  },
  {
    q: "Can I change or upgrade my plan?",
    a: "You can add All-Access at any time. Automatic upgrades with prorated billing are coming soon; until then, contact the front desk and we'll switch you over without double-charging.",
  },
  {
    q: "How does cancelling work?",
    a: "Cancel from your dashboard whenever you like. Your access continues until the end of the period you've already paid for, and you won't be billed again.",
  },
  {
    q: "What happens if a payment fails?",
    a: "Your access continues while you update your card — we'll never lock you out mid-cycle because of a failed charge. You'll see a notice in your dashboard until it's resolved.",
  },
  {
    q: "How much do I save with annual billing?",
    a: "Annual plans cost ten times the monthly price, so you get two months free every year.",
  },
  {
    q: "Do you sell class passes or personal training?",
    a: "Class packs and personal training packages are coming to the FORGE store soon, for people who'd rather not hold a recurring membership.",
  },
];

export default async function MembershipsPage() {
  const { memberships, accessObjects } = services();
  const [plans, objects] = await Promise.all([memberships.listPlans(), accessObjects.list()]);
  const cardPlans = plans.map((p) => ({
    slug: p.slug,
    name: p.name,
    type: p.type,
    priceMonthly: p.priceMonthly,
    priceAnnual: p.priceAnnual,
    benefits: p.benefits,
    accessObject: p.accessObject ? { slug: p.accessObject.slug, name: p.accessObject.name } : null,
  }));
  const covers = (planObjectId: string | null, objectId: string) => planObjectId === null || planObjectId === objectId;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <PageHero
        eyebrow="Memberships"
        title="Train where you want. Pay for what you use."
        description="FORGE is six spaces under one roof. Pick the one you train in, or unlock all six with Premium All-Access. No joining fee."
      >
        <Suspense>
          <CheckoutCancelledNotice />
        </Suspense>
      </PageHero>

      <Section className="pt-14">
        <Container>
          <PlanGrid plans={cardPlans} />
        </Container>
      </Section>

      <Section className="border-y border-bone-50/6 bg-ink-950">
        <Container className="flex flex-col gap-10">
          <SectionHeading align="center" eyebrow="Compare" title="What each plan covers" />

          {/* md+: comparison table */}
          <div className="hidden overflow-hidden rounded-2xl border border-bone-50/8 md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Access Objects covered by each membership plan</caption>
              <thead className="bg-ink-800 text-xs uppercase tracking-wider text-ink-300">
                <tr>
                  <th scope="col" className="px-5 py-4 font-medium">Plan</th>
                  {objects.map((o) => (
                    <th key={o.slug} scope="col" className="px-3 py-4 text-center font-medium">
                      <span className="flex flex-col items-center gap-1.5">
                        <ObjectIcon slug={o.slug} className="size-4 text-ember-400" />
                        {o.name.split(" /")[0]}
                      </span>
                    </th>
                  ))}
                  <th scope="col" className="px-5 py-4 text-right font-medium">Monthly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bone-50/6">
                {plans.map((p) => (
                  <tr key={p.slug} className={p.type === "ALL_ACCESS" ? "bg-ember-500/[0.07]" : undefined}>
                    <th scope="row" className="px-5 py-4 font-medium text-bone-50">
                      {p.name}
                    </th>
                    {objects.map((o) => (
                      <td key={o.slug} className="px-3 py-4 text-center">
                        {covers(p.accessObjectId, o.id) ? (
                          <Check className="mx-auto size-5 text-ember-400" aria-label="Included" />
                        ) : (
                          <Minus className="mx-auto size-4 text-ink-500" aria-label="Not included" />
                        )}
                      </td>
                    ))}
                    <td className="px-5 py-4 text-right font-display text-lg text-bone-50">{formatUsd(p.priceMonthly, { whole: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* below md: stacked cards (spec B4) */}
          <ul className="flex flex-col gap-3 md:hidden">
            {plans.map((p) => (
              <li key={p.slug} className="rounded-xl border border-bone-50/8 bg-ink-800/60 p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-lg text-bone-50">{p.name}</h3>
                  <span className="font-display text-lg text-bone-50">{formatUsd(p.priceMonthly, { whole: true })}/mo</span>
                </div>
                <p className="mt-2 text-sm text-ink-300">
                  Covers: {objects.filter((o) => covers(p.accessObjectId, o.id)).map((o) => o.name).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
          <SectionHeading eyebrow="FAQ" title="Good questions" description="Anything else? Our front desk is happy to help." />
          <div className="flex flex-col divide-y divide-bone-50/8 rounded-2xl border border-bone-50/8">
            {FAQ.map((item) => (
              <details key={item.q} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-display text-lg uppercase text-bone-50">
                  <h3>{item.q}</h3>
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full border border-bone-50/15 text-ember-400 transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-bone-200">{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
