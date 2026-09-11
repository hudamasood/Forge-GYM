import type { Metadata } from "next";
import { UserX } from "lucide-react";
import { services } from "@/server/container";
import { Container, PageHero } from "@/components/layout/section";
import { FilterChips } from "@/components/layout/filter-chips";
import { TrainerCard } from "@/components/cards/trainer-card";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/motion/reveal";
import { buildMetadata } from "@/lib/seo";
import { classFilterSchema } from "@/server/validation/schemas";

export const metadata: Metadata = buildMetadata({
  title: "Trainers",
  category: "Coaches",
  description: "Meet FORGE's lead coaches — strength, yoga, dance, cycling, boxing and CrossFit specialists with a decade of experience each.",
  path: "/trainers",
});

export default async function TrainersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { object } = classFilterSchema.parse(await searchParams);
  const { trainers, accessObjects } = services();
  const [list, objects] = await Promise.all([trainers.list({ accessObjectSlug: object }), accessObjects.list()]);

  return (
    <>
      <PageHero eyebrow="Coaches" title="Meet the team" description="Every space is led by a specialist who programs its classes and knows every member by name." />
      <Container className="flex flex-col gap-10 py-14">
        <FilterChips
          label="Filter by space"
          param="object"
          basePath="/trainers"
          current={object}
          options={[{ label: "All spaces", value: undefined }, ...objects.map((o) => ({ label: o.name, value: o.slug }))]}
        />
        {list.length === 0 ? (
          <EmptyState icon={UserX} title="No coaches here yet" message="We're recruiting for this space. Meanwhile, meet the rest of the team." action={{ label: "All coaches", href: "/trainers" }} />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((t, i) => (
              <Reveal as="li" key={t.slug} delay={(i % 3) * 80}>
                <TrainerCard trainer={t} headingLevel="h2" />
              </Reveal>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
