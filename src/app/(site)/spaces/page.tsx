import type { Metadata } from "next";
import { services } from "@/server/container";
import { Container, PageHero, SectionHeading } from "@/components/layout/section";
import { SpacesFallback } from "@/components/spaces/spaces-fallback";
import { SpacesTour } from "@/components/spaces/tour/spaces-tour";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Spaces",
  category: "Gym Tour",
  description: "Tour FORGE's six training spaces in 3D — gym floor, yoga and Zumba studios, spin studio, boxing zone and CrossFit zone — equipment, hours and classes.",
  path: "/spaces",
});

export default async function SpacesPage() {
  const objects = await services().accessObjects.list();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: objects.map((o, i) => ({ "@type": "ListItem", position: i + 1, name: o.name, url: absoluteUrl(`/spaces/${o.slug}`) })),
        }}
      />
      <PageHero eyebrow="The spaces" title="Six spaces. One building." description="Scroll through the floor — every space is built and equipped for a single discipline." />

      {/* Real-time 3D tour; renders nothing on devices without capable WebGL or with reduced motion. */}
      <SpacesTour zones={objects.map((o) => ({ slug: o.slug, name: o.name, tagline: o.tagline, description: o.description }))} />

      {/* Always-present readable version: what crawlers index and what no-WebGL devices use (spec C1). */}
      <Container className="flex flex-col gap-10 py-16">
        <SectionHeading eyebrow="Every space" title="Explore in detail" description="Equipment, hours, classes and coaches for each space." />
        <SpacesFallback objects={objects} />
      </Container>
    </>
  );
}
