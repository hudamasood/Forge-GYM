import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Award, ChevronRight } from "lucide-react";
import { services } from "@/server/container";
import { isDomainError } from "@/server/domain/errors";
import { Container } from "@/components/layout/section";
import { Monogram } from "@/components/brand/art";
import { Photo } from "@/components/brand/photo";
import { trainerImage } from "@/lib/imagery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClassCard } from "@/components/cards/class-card";
import { ScheduleTable } from "@/components/booking/schedule-table";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { GYM } from "@/lib/site";

export const revalidate = 300;

async function load(slug: string) {
  try {
    return await services().trainers.getBySlug(slug);
  } catch (error) {
    if (isDomainError(error, "NOT_FOUND")) notFound();
    throw error;
  }
}

export async function generateStaticParams() {
  const trainers = await services().trainers.list();
  return trainers.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const trainer = await load((await params).slug);
  return buildMetadata({
    title: trainer.name,
    category: "Coach",
    description: `${trainer.name}, FORGE ${trainer.primaryAccessObject.name} lead coach. ${trainer.specialty}, ${trainer.yearsExperience} years' experience.`,
    path: `/trainers/${trainer.slug}`,
  });
}

export default async function TrainerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const trainer = await load((await params).slug);
  const path = `/trainers/${trainer.slug}`;
  const rows = trainer.upcoming.map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    capacity: s.capacity,
    bookedCount: s.bookedCount,
    className: s.class.name,
    trainer: { name: s.trainer.name, slug: s.trainer.slug },
    accessObject: { name: s.accessObject.name, slug: s.accessObject.slug },
  }));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Trainers", path: "/trainers" },
            { name: trainer.name, path },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Person",
            name: trainer.name,
            jobTitle: `${trainer.primaryAccessObject.name} Lead Coach`,
            description: trainer.bio,
            url: absoluteUrl(path),
            knowsAbout: [trainer.specialty, ...trainer.classes.map((c) => c.name)],
            hasCredential: trainer.certifications.map((c) => ({ "@type": "EducationalOccupationalCredential", name: c })),
            worksFor: { "@type": "HealthClub", name: GYM.name, url: absoluteUrl("/") },
          },
        ]}
      />

      <Container className="grid gap-12 py-12 lg:grid-cols-[26rem_1fr] lg:py-16">
        <div className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <Photo
            image={trainerImage(trainer.slug, trainer.photoUrl)}
            sizes="(min-width: 1024px) 26rem, 100vw"
            priority
            className="aspect-[4/5] animate-fade-up rounded-3xl border border-bone-50/8 shadow-warm-lg"
            fallback={<Monogram name={trainer.name} className="aspect-[4/5] animate-fade-up rounded-3xl border border-bone-50/8" />}
          />
          <div className="rounded-2xl border border-bone-50/8 bg-ink-800/60 p-6">
            <h2 className="flex items-center gap-2 font-display text-lg text-bone-50">
              <Award className="size-5 text-ember-400" aria-hidden /> Certifications
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {trainer.certifications.map((c) => (
                <li key={c}>
                  <Badge>{c}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-12">
          <div className="flex animate-fade-up flex-col gap-6">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-1.5 text-sm text-ink-300">
                <li>
                  <Link href="/trainers" className="hover:text-bone-50">
                    Trainers
                  </Link>
                </li>
                <li aria-hidden><ChevronRight className="size-3.5" /></li>
                <li aria-current="page" className="text-bone-200">
                  {trainer.name}
                </li>
              </ol>
            </nav>
            <Badge tone="ember" className="self-start">
              {trainer.primaryAccessObject.name} lead
            </Badge>
            <h1 className="text-5xl font-semibold text-bone-50 sm:text-7xl">{trainer.name}</h1>
            <p className="font-display text-xl uppercase tracking-wide text-ember-300">
              {trainer.specialty} · {trainer.yearsExperience} years
            </p>
            <p className="max-w-2xl text-lg leading-relaxed text-bone-200">{trainer.bio}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href={`/spaces/${trainer.primaryAccessObject.slug}`}>
                  Explore the {trainer.primaryAccessObject.name} <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>

          {trainer.classes.length > 0 && (
            <section aria-labelledby="classes-heading" className="flex flex-col gap-5">
              <h2 id="classes-heading" className="text-3xl font-semibold text-bone-50">
                Classes {trainer.name.split(" ")[0]} teaches
              </h2>
              <ul className="grid gap-5 sm:grid-cols-2">
                {trainer.classes.map((c) => (
                  <li key={c.slug}>
                    <ClassCard gymClass={c} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {rows.length > 0 && (
            <section aria-labelledby="next-heading" className="flex flex-col gap-5">
              <h2 id="next-heading" className="text-3xl font-semibold text-bone-50">
                Next sessions
              </h2>
              <ScheduleTable rows={rows} showClassName />
            </section>
          )}
        </div>
      </Container>
    </>
  );
}
