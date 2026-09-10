import Link from "next/link";
import { ArtPanel, CATEGORY_ICONS } from "@/components/brand/art";
import { Badge } from "@/components/ui/badge";
import { formatUsd, titleCase } from "@/lib/format";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import type { ProductCategory } from "@/server/domain/types";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  description: string;
}

export function ProductCard({ product, headingLevel = "h3" }: { product: ProductCardData; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const soldOut = product.stock <= 0;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-bone-50/8 bg-ink-800/80 transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-forge)] hover:-translate-y-1 hover:border-bone-50/15 hover:shadow-warm-lg">
      <div className="relative overflow-hidden">
        <ArtPanel seed={product.slug} icon={CATEGORY_ICONS[product.category]} intensity={0.8} className="aspect-square transition-transform duration-500 group-hover:scale-[1.03]" />
        {soldOut && (
          <Badge tone="neutral" className="absolute right-4 top-4 bg-ink-900/90">
            Sold out
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-300">{titleCase(product.category)}</p>
        <Heading className="font-display text-xl font-semibold normal-case text-bone-50">
          <Link href={`/store/${product.slug}`} className="rounded focus-visible:outline-offset-4">
            {product.name}
          </Link>
        </Heading>
        <p className="line-clamp-2 text-sm text-ink-300">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="font-display text-2xl text-bone-50">{formatUsd(product.price)}</span>
          <AddToCartButton product={product} size="sm" disabled={soldOut} />
        </div>
      </div>
    </article>
  );
}
