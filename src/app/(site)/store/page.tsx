import type { Metadata } from "next";
import { PackageSearch, Search } from "lucide-react";
import { services } from "@/server/container";
import { Container, PageHero } from "@/components/layout/section";
import { FilterChips } from "@/components/layout/filter-chips";
import { ProductCard } from "@/components/cards/product-card";
import { EmptyState } from "@/components/ui/states";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { buildMetadata } from "@/lib/seo";
import { titleCase } from "@/lib/format";
import { productFilterSchema } from "@/server/validation/schemas";
import { PRODUCT_CATEGORIES } from "@/server/domain/types";

export const metadata: Metadata = buildMetadata({
  title: "Store",
  category: "Shop",
  description: "Shop FORGE supplements, training equipment, merchandise and coach-written programs. Secure checkout, prices in USD.",
  path: "/store",
});

export default async function StorePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { category, q } = productFilterSchema.parse(await searchParams);
  const products = await services().orders.listProducts({ category, search: q });

  return (
    <>
      <PageHero eyebrow="The store" title="Fuel. Gear. Programs." description="Everything our coaches actually use — from whey isolate to 14 oz gloves." />
      <Container className="flex flex-col gap-8 py-14">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterChips
            label="Filter by category"
            param="category"
            basePath="/store"
            current={category}
            otherParams={{ q }}
            options={[{ label: "Everything", value: undefined }, ...PRODUCT_CATEGORIES.map((c) => ({ label: titleCase(c), value: c }))]}
          />
          <form role="search" action="/store" className="flex gap-2 lg:w-80">
            {category && <input type="hidden" name="category" value={category} />}
            <label htmlFor="store-search" className="sr-only">
              Search products
            </label>
            <Input id="store-search" name="q" type="search" defaultValue={q} placeholder="Search products" />
            <Button type="submit" variant="secondary" size="icon" aria-label="Search">
              <Search aria-hidden />
            </Button>
          </form>
        </div>

        <p className="text-sm text-ink-300" aria-live="polite">
          {products.length} {products.length === 1 ? "product" : "products"}
          {q ? ` matching “${q}”` : ""}
        </p>

        {products.length === 0 ? (
          <EmptyState icon={PackageSearch} title="Nothing found" message="Try a different search or category." action={{ label: "Clear filters", href: "/store" }} />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={(i % 4) * 60}>
                <ProductCard product={p} headingLevel="h2" />
              </Reveal>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
