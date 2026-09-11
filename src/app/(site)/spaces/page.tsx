import type { Metadata } from "next";
import { services } from "@/server/container";
import { Container, PageHero } from "@/components/layout/section";
import { SpacesFallback } from "@/components/spaces/spaces-fallback";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Spaces",
  category: "Gym Tour",
  description: "Tour FORGE's six training spaces — gym floor, yoga and Zumba studios, spin studio, boxing zone and CrossFit zone — equipment, hours and classes.",
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
      <Container className="py-14">
        <SpacesFallback objects={objects} />
      </Container>
    </>
  );
}
