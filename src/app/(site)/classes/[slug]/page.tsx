import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarX, Check, ChevronRight, Clock, Flame, Gauge, Users } from "lucide-react";
import { services } from "@/server/container";
import { isDomainError } from "@/server/domain/errors";
import { Container } from "@/components/layout/section";
import { ArtPanel, OBJECT_ICONS } from "@/components/brand/art";
import { Photo } from "@/components/brand/photo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/cards/badges";
import { ScheduleTable } from "@/components/booking/schedule-table";
import { EmptyState } from "@/components/ui/states";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { formatUsd, titleCase } from "@/lib/format";
import { classImage } from "@/lib/imagery";
import { GYM } from "@/lib/site";

export const revalidate = 60;

async function load(slug: string) {
  try {
    return await services().classes.getBySlug(slug);
  } catch (error) {
    if (isDomainError(error, "NOT_FOUND")) notFound();
    throw error;
  }
}

export async function generateStaticParams() {
  const classes = await services().classes.list();
  return classes.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const gymClass = await load((await params).slug);
  return buildMetadata({
    title: gymClass.name,
    category: "Class",
    description: `${gymClass.name} at FORGE's ${gymClass.accessObject.name}: ${gymClass.durationMinutes} min, ${titleCase(gymClass.difficulty).toLowerCase()}. ${gymClass.description}`,
    path: `/classes/${gymClass.slug}`,
  });
}

export default async function ClassDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const gymClass = await load((await params).slug);
  const plans = await services().memberships.listPlans();
  const coveringPlan = plans.find((p) => p.accessObjectId === gymClass.accessObjectId);
  const allAccess = plans.find((p) => p.type === "ALL_ACCESS");
  const coaches = [...new Map(gymClass.schedule.map((s) => [s.trainer.slug, s.trainer])).values()];
  const path = `/classes/${gymClass.slug}`;

  const rows = gymClass.schedule.map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    capacity: s.capacity,
    bookedCount: s.bookedCount,
    className: gymClass.name,
    trainer: { name: s.trainer.name, slug: s.trainer.slug },
    accessObject: { name: s.accessObject.name, slug: s.accessObject.slug },
  }));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Classes", path: "/classes" },
            { name: gymClass.name, path },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Course",
            name: gymClass.name,
            description: gymClass.description,
            url: absoluteUrl(path),
            provider: { "@type": "HealthClub", name: GYM.name, url: absoluteUrl("/") },
            educationalLevel: titleCase(gymClass.difficulty),
            hasCourseInstance: gymClass.schedule.slice(0, 10).map((s) => ({
              "@type": "CourseInstance",
              courseMode: "Onsite",
              startDate: s.startTime.toISOString(),
              endDate: s.endTime.toISOString(),
              location: { "@type": "Place", name: `${GYM.name} ${s.accessObject.name}`, address: `${GYM.address.street}, ${GYM.address.city}` },
              instructor: { "@type": "Person", name: s.trainer.name, url: absoluteUrl(`/trainers/${s.trainer.slug}`) },
            })),
          },
        ]}
      />

      <div className="grain relative overflow-hidden border-b border-bone-50/6">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_85%_0%,rgba(194,65,12,0.25),transparent_70%)]" />
        <Container className="grid gap-10 py-12 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:py-16">
          <div className="flex animate-fade-up flex-col gap-6">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-1.5 text-sm text-ink-300">
                <li>
                  <Link href="/classes" className="hover:text-bone-50">
                    Classes
                  </Link>
                </li>
                <li aria-hidden><ChevronRight className="size-3.5" /></li>
                <li aria-current="page" className="text-bone-200">
                  {gymClass.name}
                </li>
              </ol>
            </nav>
            <div className="flex flex-wrap gap-2">
              <Badge tone="steel">{gymClass.accessObject.name}</Badge>
              <DifficultyBadge difficulty={gymClass.difficulty} />
            </div>
            <h1 className="text-5xl font-semibold text-bone-50 sm:text-7xl">{gymClass.name}</h1>
            <p className="max-w-xl text-lg leading-relaxed text-bone-200">{gymClass.description}</p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Clock, label: "Duration", value: `${gymClass.durationMinutes} min` },
                { icon: Flame, label: "Calories", value: `~${gymClass.estCalories}` },
                { icon: Users, label: "Class size", value: `${gymClass.defaultCapacity}` },
                { icon: Gauge, label: "Level", value: titleCase(gymClass.difficulty) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-bone-50/8 bg-ink-800/60 p-4">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink-300">
                    <stat.icon className="size-3.5 text-ember-400" aria-hidden /> {stat.label}
                  </dt>
                  <dd className="mt-1 font-display text-xl text-bone-50">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <Photo
            image={classImage(gymClass.slug, gymClass.imageUrl)}
            sizes="(min-width: 1024px) 45vw, 100vw"
            priority
            className="aspect-[4/3] animate-fade-up rounded-3xl border border-bone-50/8 shadow-warm-lg [animation-delay:150ms]"
            fallback={<ArtPanel seed={gymClass.slug} icon={OBJECT_ICONS[gymClass.accessObject.slug]} label={gymClass.accessObject.name.split(" ")[0]} className="aspect-[4/3] animate-fade-up rounded-3xl border border-bone-50/8 [animation-delay:150ms]" />}
          />
        </Container>
      </div>

      <Container className="grid gap-12 py-14 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-12">
          <section aria-labelledby="schedule-heading" className="flex flex-col gap-5">
            <div className="flex items-end justify-between gap-4">
              <h2 id="schedule-heading" className="text-3xl font-semibold text-bone-50">
                Upcoming sessions
              </h2>
            </div>
            {rows.length === 0 ? (
              <EmptyState icon={CalendarX} title="No sessions scheduled" message="New sessions are added every week. Check back soon or browse other classes." action={{ label: "All classes", href: "/classes" }} />
            ) : (
              <ScheduleTable rows={rows} />
            )}
          </section>

          <section aria-labelledby="benefits-heading" className="flex flex-col gap-5">
            <h2 id="benefits-heading" className="text-3xl font-semibold text-bone-50">
              What you get
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {gymClass.benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 rounded-xl border border-bone-50/8 bg-ink-800/50 p-4 text-bone-100">
                  <Check className="size-5 shrink-0 text-ember-400" aria-hidden /> {b}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-ember-400/30 bg-ember-500/[0.07] p-6">
            <h2 className="font-display text-xl text-bone-50">Included with</h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              {coveringPlan && (
                <li className="flex items-center justify-between gap-3">
                  <span className="text-bone-100">{coveringPlan.name}</span>
                  <span className="text-bone-50">{formatUsd(coveringPlan.priceMonthly, { whole: true })}/mo</span>
                </li>
              )}
              {allAccess && (
                <li className="flex items-center justify-between gap-3">
                  <span className="text-bone-100">{allAccess.name}</span>
                  <span className="text-bone-50">{formatUsd(allAccess.priceMonthly, { whole: true })}/mo</span>
                </li>
              )}
            </ul>
            <Button asChild className="mt-5 w-full">
              <Link href="/memberships">
                Get a membership <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-bone-50/8 bg-ink-800/60 p-6">
            <h2 className="font-display text-xl text-bone-50">Where & who</h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              <li>
                <Link href={`/spaces/${gymClass.accessObject.slug}`} className="group flex items-center justify-between text-bone-100 hover:text-ember-300">
                  {gymClass.accessObject.name} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
              {coaches.map((c) => (
                <li key={c.slug}>
                  <Link href={`/trainers/${c.slug}`} className="group flex items-center justify-between text-bone-100 hover:text-ember-300">
                    Coach {c.name} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </Container>
    </>
  );
}
