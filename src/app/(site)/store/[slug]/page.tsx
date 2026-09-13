import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { services } from "@/server/container";
import { isDomainError } from "@/server/domain/errors";
import { Container } from "@/components/layout/section";
import { ArtPanel, CATEGORY_ICONS } from "@/components/brand/art";
import { Photo } from "@/components/brand/photo";
import { productImage } from "@/lib/imagery";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/cards/product-card";
import { ProductPurchase } from "@/components/store/product-purchase";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { formatUsd, titleCase } from "@/lib/format";
import { GYM } from "@/lib/site";

export const revalidate = 120;

async function load(slug: string) {
  try {
    return await services().orders.getProduct(slug);
  } catch (error) {
    if (isDomainError(error, "NOT_FOUND")) notFound();
    throw error;
  }
}

export async function generateStaticParams() {
  const products = await services().orders.listProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await load((await params).slug);
  return buildMetadata({ title: product.name, category: "Store", description: `${product.description} ${formatUsd(product.price)} at the FORGE store.`, path: `/store/${product.slug}` });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await load((await params).slug);
  const related = (await services().orders.listProducts({ category: product.category })).filter((p) => p.id !== product.id).slice(0, 4);
  const path = `/store/${product.slug}`;
  const digital = product.category === "DIGITAL";
  const lowStock = !digital && product.stock > 0 && product.stock <= 5;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Store", path: "/store" },
            { name: product.name, path },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            sku: product.slug,
            category: titleCase(product.category),
            brand: { "@type": "Brand", name: GYM.name },
            url: absoluteUrl(path),
            offers: {
              "@type": "Offer",
              price: (product.price / 100).toFixed(2),
              priceCurrency: "USD",
              availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url: absoluteUrl(path),
              seller: { "@type": "Organization", name: GYM.name },
            },
          },
        ]}
      />
      <Container className="grid gap-12 py-12 lg:grid-cols-2 lg:py-16">
        <Photo
          image={productImage(product.slug, product.images)}
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          grade={false}
          className="aspect-square animate-fade-up rounded-3xl border border-bone-50/8 shadow-warm-lg"
          fallback={<ArtPanel seed={product.slug} icon={CATEGORY_ICONS[product.category]} className="aspect-square animate-fade-up rounded-3xl border border-bone-50/8" />}
        />
        <div className="flex animate-fade-up flex-col gap-6 [animation-delay:120ms]">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm text-ink-300">
              <li>
                <Link href="/store" className="hover:text-bone-50">
                  Store
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="size-3.5" />
              </li>
              <li>
                <Link href={`/store?category=${product.category}`} className="hover:text-bone-50">
                  {titleCase(product.category)}
                </Link>
              </li>
            </ol>
          </nav>
          <h1 className="text-4xl font-semibold normal-case text-bone-50 sm:text-5xl">{product.name}</h1>
          <p className="font-display text-4xl text-bone-50">{formatUsd(product.price)}</p>
          <div className="flex flex-wrap gap-2">
            {product.stock <= 0 ? <Badge tone="error">Sold out</Badge> : lowStock ? <Badge tone="warning">Only {product.stock} left</Badge> : <Badge tone="success">In stock</Badge>}
            {digital && <Badge tone="steel">Digital download</Badge>}
          </div>
          <p className="text-lg leading-relaxed text-bone-200">{product.description}</p>
          <ProductPurchase product={{ id: product.id, slug: product.slug, name: product.name, category: product.category, price: product.price, stock: product.stock }} />
          <ul className="mt-2 grid gap-3 border-t border-bone-50/8 pt-6 text-sm text-bone-200 sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-ember-400" aria-hidden /> Secure Stripe checkout
            </li>
            <li className="flex items-center gap-2">
              {digital ? <PackageCheck className="size-5 text-ember-400" aria-hidden /> : <Truck className="size-5 text-ember-400" aria-hidden />}
              {digital ? "Delivered by email" : "Fulfilment details by email"}
            </li>
            <li className="flex items-center gap-2">
              <PackageCheck className="size-5 text-ember-400" aria-hidden /> Coach approved
            </li>
          </ul>
        </div>
      </Container>

      {related.length > 0 && (
        <Container className="flex flex-col gap-6 pb-20">
          <h2 className="text-3xl font-semibold text-bone-50">More {titleCase(product.category).toLowerCase()}</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </Container>
      )}
    </>
  );
}
