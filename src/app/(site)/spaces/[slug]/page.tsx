import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Clock, Wrench } from "lucide-react";
import { services } from "@/server/container";
import { isDomainError } from "@/server/domain/errors";
import { Container } from "@/components/layout/section";
import { ArtPanel, OBJECT_ICONS } from "@/components/brand/art";
import { Photo } from "@/components/brand/photo";
import { spaceImage } from "@/lib/imagery";
import { Button } from "@/components/ui/button";
import { ClassCard } from "@/components/cards/class-card";
import { TrainerCard } from "@/components/cards/trainer-card";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { formatUsd, titleCase } from "@/lib/format";
import { GYM } from "@/lib/site";

export const revalidate = 300;

async function load(slug: string) {
  try {
    return await services().accessObjects.getBySlug(slug);
  } catch (error) {
    if (isDomainError(error, "NOT_FOUND")) notFound();
    throw error;
  }
}

export async function generateStaticParams() {
  const objects = await services().accessObjects.list();
  return objects.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const obj = await load((await params).slug);
  return buildMetadata({ title: obj.name, category: "Space", description: `${obj.tagline} ${obj.description}`, path: `/spaces/${obj.slug}` });
}

export default async function SpaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const obj = await load((await params).slug);
  const { classes, trainers, memberships } = services();
  const [spaceClasses, coaches, plans] = await Promise.all([
    classes.list({ accessObjectSlug: obj.slug }),
    trainers.list({ accessObjectSlug: obj.slug }),
    memberships.listPlans(),
  ]);
  const plan = plans.find((p) => p.accessObjectId === obj.id);
  const path = `/spaces/${obj.slug}`;
  const equipment = obj.space?.equipmentList ?? [];
  const hours = Object.entries(obj.space?.operatingHours ?? {});

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Spaces", path: "/spaces" },
            { name: obj.name, path },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "SportsActivityLocation",
            name: `${GYM.name} ${obj.name}`,
            description: obj.description,
            url: absoluteUrl(path),
            containedInPlace: { "@type": "HealthClub", name: GYM.name, url: absoluteUrl("/") },
            amenityFeature: equipment.map((e) => ({ "@type": "LocationFeatureSpecification", name: e, value: true })),
          },
        ]}
      />

      <section className="grain relative -mt-18 overflow-hidden pt-18">
        <Photo
          image={spaceImage(obj.slug, obj.heroImageUrl)}
          sizes="100vw"
          priority
          className="absolute inset-0 -z-10"
          fallback={<ArtPanel seed={obj.slug} icon={OBJECT_ICONS[obj.slug]} className="absolute inset-0 -z-10 opacity-70" intensity={1.2} />}
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900 via-ink-900/75 to-ink-900/25" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950/70 to-transparent" />
        <Container className="flex min-h-[60vh] flex-col justify-end gap-6 pb-14 pt-20">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm text-bone-300">
              <li>
                <Link href="/spaces" className="hover:text-bone-50">
                  Spaces
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="size-3.5" />
              </li>
              <li aria-current="page" className="text-bone-100">
                {obj.name}
              </li>
            </ol>
          </nav>
          <h1 className="animate-fade-up text-6xl font-semibold text-bone-50 sm:text-8xl">{obj.name}</h1>
          <p className="max-w-2xl animate-fade-up text-xl text-bone-100 [animation-delay:120ms]">{obj.tagline}</p>
          <div className="flex animate-fade-up flex-wrap gap-3 [animation-delay:220ms]">
            <Button asChild size="lg">
              <Link href="/memberships">
                {plan ? `Join from ${formatUsd(plan.priceMonthly, { whole: true })}/mo` : "View memberships"} <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/spaces">Tour all spaces in 3D</Link>
            </Button>
          </div>
        </Container>
      </section>

      <Container className="grid gap-12 py-14 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <h2 className="text-3xl font-semibold text-bone-50">About the space</h2>
          <p className="text-lg leading-relaxed text-bone-200">{obj.description}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-2xl border border-bone-50/8 bg-ink-800/60 p-6">
            <h2 className="flex items-center gap-2 font-display text-lg text-bone-50">
              <Wrench className="size-5 text-ember-400" aria-hidden /> Equipment
            </h2>
            <ul className="mt-4 grid gap-2 text-sm text-bone-100">
              {equipment.map((e) => (
                <li key={e} className="flex items-center gap-2">
                  <span aria-hidden className="size-1.5 rounded-full bg-ember-400" /> {e}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-bone-50/8 bg-ink-800/60 p-6">
            <h2 className="flex items-center gap-2 font-display text-lg text-bone-50">
              <Clock className="size-5 text-ember-400" aria-hidden /> Hours
            </h2>
            <dl className="mt-4 grid gap-2 text-sm">
              {hours.map(([day, time]) => (
                <div key={day} className="flex justify-between gap-3">
                  <dt className="text-ink-300">{titleCase(day)}</dt>
                  <dd className="text-bone-100">{time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>

      {spaceClasses.length > 0 && (
        <Container className="flex flex-col gap-6 pb-14">
          <h2 className="text-3xl font-semibold text-bone-50">Classes in the {obj.name}</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {spaceClasses.map((c) => (
              <li key={c.slug}>
                <ClassCard gymClass={c} />
              </li>
            ))}
          </ul>
        </Container>
      )}

      {coaches.length > 0 && (
        <Container className="flex flex-col gap-6 pb-20">
          <h2 className="text-3xl font-semibold text-bone-50">Your coaches here</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((t) => (
              <li key={t.slug}>
                <TrainerCard trainer={t} />
              </li>
            ))}
          </ul>
        </Container>
      )}
    </>
  );
}
