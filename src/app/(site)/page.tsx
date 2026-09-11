import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Box, CalendarCheck, Compass, CreditCard, LayoutDashboard, ShoppingBag } from "lucide-react";
import { services } from "@/server/container";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeading } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { ArtPanel, OBJECT_ICONS } from "@/components/brand/art";
import { TrainerCard } from "@/components/cards/trainer-card";
import { ProductCard } from "@/components/cards/product-card";
import { DifficultyBadge } from "@/components/cards/badges";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, healthClubJsonLd } from "@/lib/seo";
import { formatDateTime, formatUsd } from "@/lib/format";
import { GYM } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "FORGE Gym | Strength is made, not born",
  description: "Premium strength gym with six dedicated spaces — gym floor, yoga, Zumba, spin, boxing and CrossFit. Pick one space or go All-Access.",
  path: "/",
});

const JOURNEY = [
  { step: "Discover", icon: Compass, text: "Six dedicated spaces, each built for one discipline." },
  { step: "Explore", icon: Box, text: "Walk the floor in 3D and meet the coaches." },
  { step: "Join", icon: CreditCard, text: "One space from $35/mo — or every space with All-Access." },
  { step: "Book", icon: CalendarCheck, text: "Reserve classes your membership covers in seconds." },
  { step: "Shop", icon: ShoppingBag, text: "Fuel, gear and programs from the FORGE store." },
  { step: "Manage", icon: LayoutDashboard, text: "Bookings, orders and billing in one dashboard." },
];

export default async function HomePage() {
  const { accessObjects, classes, trainers, schedules, memberships, orders } = services();
  const [objects, classFormats, coaches, upcoming, plans, products] = await Promise.all([
    accessObjects.list(),
    classes.list(),
    trainers.list(),
    schedules.listUpcoming({ limit: 6 }),
    memberships.listPlans(),
    orders.listProducts(),
  ]);
  const cheapest = Math.min(...plans.map((p) => p.priceMonthly));
  const allAccess = plans.find((p) => p.type === "ALL_ACCESS");
  const featuredProducts = products.filter((p) => p.category !== "DIGITAL").slice(0, 4);

  return (
    <>
      <JsonLd data={healthClubJsonLd()} />

      {/* Hero */}
      <section className="grain relative -mt-18 flex min-h-[100svh] items-end overflow-hidden pb-16 pt-36 sm:pb-24">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -right-[20%] -top-[30%] size-[70rem] animate-glow rounded-full bg-[radial-gradient(circle,rgba(221,90,34,0.38),rgba(127,42,8,0.12)_40%,transparent_65%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(250,248,244,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(250,248,244,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(80%_70%_at_60%_40%,black,transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink-900 to-transparent" />
        </div>
        <Container className="flex flex-col gap-10">
          <p className="animate-fade-up font-display text-sm tracking-[0.35em] text-ember-400 [animation-delay:100ms]">FORGE · STRENGTH GYM</p>
          <h1 className="font-display text-[clamp(3.5rem,11vw,10rem)] font-semibold uppercase leading-[0.88] tracking-tight text-bone-50">
            <span className="block animate-fade-up [animation-delay:150ms]">Strength</span>
            <span className="block animate-fade-up [animation-delay:250ms]">is made,</span>
            <span className="block animate-fade-up bg-gradient-to-r from-ember-300 via-ember-400 to-ember-600 bg-clip-text text-transparent [animation-delay:350ms]">not born.</span>
          </h1>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-xl animate-fade-up text-lg leading-relaxed text-bone-200 [animation-delay:450ms]">
              Six dedicated training spaces. Coaches who obsess over your form. Memberships built around how you actually train — one space, or all of them.
            </p>
            <div className="flex animate-fade-up flex-wrap gap-3 [animation-delay:550ms]">
              <Button asChild size="lg">
                <Link href="/memberships">
                  Find your membership <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/classes">Browse classes</Link>
              </Button>
            </div>
          </div>
          <dl className="grid animate-fade-up grid-cols-2 gap-px overflow-hidden rounded-2xl border border-bone-50/8 bg-bone-50/8 [animation-delay:650ms] sm:grid-cols-4">
            {[
              { label: "Training spaces", value: objects.length },
              { label: "Class formats", value: classFormats.length },
              { label: "Expert coaches", value: coaches.length },
              { label: "Memberships from", value: `${formatUsd(cheapest, { whole: true })}/mo` },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1 bg-ink-900/90 p-5 backdrop-blur">
                <dt className="text-xs uppercase tracking-[0.18em] text-ink-300">{stat.label}</dt>
                <dd className="font-display text-3xl font-semibold text-bone-50">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Discipline marquee */}
      <div className="overflow-hidden border-y border-bone-50/8 bg-ink-950 py-5" aria-hidden data-decorative>
        <div className="flex w-max animate-marquee gap-12 font-display text-3xl uppercase tracking-wider text-bone-50/15 motion-reduce:animate-none">
          {[...objects, ...objects, ...objects].map((o, i) => (
            <span key={`${o.slug}-${i}`} className="flex items-center gap-12">
              {o.name}
              <span className="text-ember-500/60">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Spaces */}
      <Section>
        <Container className="flex flex-col gap-12">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading
              eyebrow="Six spaces"
              title={
                <>
                  One gym. <span className="text-ember-400">Six worlds.</span>
                </>
              }
              description="Every discipline gets its own dedicated space, equipment and coach — and its own membership. Train in one, or unlock them all."
            />
            <Button asChild variant="outline">
              <Link href="/spaces">
                Take the 3D tour <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {objects.map((obj, i) => (
              <Reveal as="li" key={obj.slug} delay={i * 70}>
                <Link
                  href={`/spaces/${obj.slug}`}
                  className="group relative block overflow-hidden rounded-2xl border border-bone-50/8 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-ember-400/40"
                >
                  <ArtPanel seed={obj.slug} icon={OBJECT_ICONS[obj.slug]} className="aspect-[4/3] transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 via-ink-950/80 to-transparent p-6 pt-20">
                    <h3 className="font-display text-2xl font-semibold text-bone-50">{obj.name}</h3>
                    <p className="mt-1 text-sm text-bone-200">{obj.tagline}</p>
                  </div>
                  <ArrowRight className="absolute right-5 top-5 size-5 -rotate-45 text-bone-50 opacity-0 transition-all duration-300 group-hover:rotate-0 group-hover:opacity-100" aria-hidden />
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Journey */}
      <Section className="border-y border-bone-50/6 bg-ink-950">
        <Container className="flex flex-col gap-14">
          <SectionHeading align="center" eyebrow="How it works" title="From first visit to fully forged" />
          <ol className="grid gap-px overflow-hidden rounded-2xl border border-bone-50/8 bg-bone-50/8 sm:grid-cols-2 lg:grid-cols-6">
            {JOURNEY.map((item, i) => (
              <Reveal as="li" key={item.step} delay={i * 80} className="group flex flex-col gap-4 bg-ink-900 p-6 transition-colors hover:bg-ink-800">
                <span className="flex items-center justify-between">
                  <item.icon className="size-6 text-ember-400 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden />
                  <span className="font-display text-sm text-ink-300">0{i + 1}</span>
                </span>
                <span className="font-display text-2xl uppercase text-bone-50">{item.step}</span>
                <span className="text-sm leading-relaxed text-ink-300">{item.text}</span>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Upcoming classes */}
      <Section>
        <Container className="flex flex-col gap-12">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading eyebrow="On the timetable" title="Coming up this week" description="Real sessions, live seat counts. Your membership decides which ones you can book." />
            <Button asChild variant="secondary">
              <Link href="/classes">All classes</Link>
            </Button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-ink-300">The timetable is being refreshed — check back soon.</p>
          ) : (
            <ul className="divide-y divide-bone-50/6 overflow-hidden rounded-2xl border border-bone-50/8">
              {upcoming.map((s, i) => {
                const left = Math.max(s.capacity - s.bookedCount, 0);
                return (
                  <Reveal as="li" key={s.id} delay={i * 50}>
                    <Link href={`/classes/${s.class.slug}`} className="group grid items-center gap-3 bg-ink-800/40 p-5 transition-colors hover:bg-ink-800 sm:grid-cols-[10rem_1fr_auto] sm:gap-6">
                      <span className="font-display text-lg text-ember-300">{formatDateTime(s.startTime)}</span>
                      <span className="flex flex-col gap-1">
                        <span className="font-display text-xl uppercase text-bone-50 group-hover:text-ember-300">{s.class.name}</span>
                        <span className="text-sm text-ink-300">
                          {s.accessObject.name} · with {s.trainer.name} · {s.class.durationMinutes} min
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <DifficultyBadge difficulty={s.class.difficulty} />
                        <span className={left === 0 ? "text-sm text-error-light" : left <= 3 ? "text-sm text-warning-light" : "text-sm text-bone-200"}>
                          {left === 0 ? "Full" : `${left} spots left`}
                        </span>
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </ul>
          )}
        </Container>
      </Section>

      {/* Coaches */}
      <Section className="bg-ink-950">
        <Container className="flex flex-col gap-12">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading eyebrow="The coaches" title="Led by specialists" description="One lead coach per space, each with a decade of craft behind them." />
            <Button asChild variant="secondary">
              <Link href="/trainers">Meet the team</Link>
            </Button>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.slice(0, 6).map((t, i) => (
              <Reveal as="li" key={t.slug} delay={i * 70}>
                <TrainerCard trainer={t} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Membership teaser */}
      <Section>
        <Container>
          <div className="grain relative overflow-hidden rounded-3xl border border-ember-400/30 bg-[linear-gradient(135deg,rgba(194,65,12,0.35),rgba(28,27,25,0.9)_55%)] p-8 sm:p-14">
            <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              <SectionHeading
                eyebrow="Memberships"
                title="Pay for the space you use. Or take the whole building."
                description={`Single-space memberships start at ${formatUsd(cheapest, { whole: true })} a month. ${allAccess ? `${allAccess.name} unlocks all six spaces for ${formatUsd(allAccess.priceMonthly, { whole: true })} a month.` : ""} Pay annually and get two months free.`}
              />
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild size="lg">
                  <Link href="/memberships">
                    Compare memberships <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="light">
                  <Link href="/signup">Create your account</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Store */}
      <Section className="pt-0">
        <Container className="flex flex-col gap-12">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading eyebrow="The store" title="Fuel and gear" description="Supplements, equipment and FORGE merch — picked by our coaches." />
            <Button asChild variant="secondary">
              <Link href="/store">Shop all</Link>
            </Button>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={i * 70}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-bone-50/8 bg-ink-950 py-24">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_100%,rgba(194,65,12,0.3),transparent_70%)]" />
        <Container className="relative flex flex-col items-center gap-8 text-center">
          <p className="font-display text-[clamp(2.5rem,7vw,6rem)] font-semibold uppercase leading-[0.9] text-bone-50">
            Your first rep <span className="text-ember-400">starts here.</span>
          </p>
          <p className="max-w-lg text-bone-200">{GYM.hours.weekdays} on weekdays, {GYM.hours.weekends} on weekends.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/memberships">Join FORGE</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">Visit us</Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
