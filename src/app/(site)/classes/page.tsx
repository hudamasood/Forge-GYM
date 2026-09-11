import type { Metadata } from "next";
import { CalendarX } from "lucide-react";
import { services } from "@/server/container";
import { Container, PageHero } from "@/components/layout/section";
import { FilterChips } from "@/components/layout/filter-chips";
import { ClassCard } from "@/components/cards/class-card";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/motion/reveal";
import { buildMetadata } from "@/lib/seo";
import { titleCase } from "@/lib/format";
import { classFilterSchema } from "@/server/validation/schemas";
import { DIFFICULTIES } from "@/server/domain/types";

export const metadata: Metadata = buildMetadata({
  title: "Classes",
  category: "Gym",
  description: "Yoga, Zumba, spin, boxing, CrossFit and strength classes at FORGE. Filter by space and level, check live seats and book with your membership.",
  path: "/classes",
});

export default async function ClassesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filter = classFilterSchema.parse(await searchParams);
  const { classes, accessObjects } = services();
  const [list, objects] = await Promise.all([classes.list({ accessObjectSlug: filter.object, difficulty: filter.difficulty }), accessObjects.list()]);

  return (
    <>
      <PageHero
        eyebrow="Classes"
        title="Find your class"
        description="Every class belongs to one of our six spaces. Your membership covers the classes in the spaces it includes — All-Access covers them all."
      />
      <Container className="flex flex-col gap-10 py-14">
        <div className="flex flex-col gap-4">
          <FilterChips
            label="Filter by space"
            param="object"
            basePath="/classes"
            current={filter.object}
            otherParams={{ difficulty: filter.difficulty }}
            options={[{ label: "All spaces", value: undefined }, ...objects.map((o) => ({ label: o.name, value: o.slug }))]}
          />
          <FilterChips
            label="Filter by level"
            param="difficulty"
            basePath="/classes"
            current={filter.difficulty}
            otherParams={{ object: filter.object }}
            options={[{ label: "Any level", value: undefined }, ...DIFFICULTIES.map((d) => ({ label: titleCase(d), value: d }))]}
          />
        </div>

        <p className="text-sm text-ink-300" aria-live="polite">
          {list.length} {list.length === 1 ? "class" : "classes"}
        </p>

        {list.length === 0 ? (
          <EmptyState icon={CalendarX} title="No classes match" message="Try another space or level — or clear the filters to see everything." action={{ label: "Clear filters", href: "/classes" }} />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c, i) => (
              <Reveal as="li" key={c.slug} delay={(i % 3) * 80}>
                <ClassCard gymClass={c} headingLevel="h2" />
              </Reveal>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
