import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { services } from "@/server/container";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Panel } from "@/components/admin/admin-ui";
import { ProductForm } from "../../entity-forms";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const product = isNew ? undefined : (await services().orders.listProducts()).find((p) => p.id === id);
  if (!isNew && !product) notFound();

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-300 hover:text-bone-50">
        <ArrowLeft className="size-4" aria-hidden /> All products
      </Link>
      <PortalHeader title={product ? `Edit ${product.name}` : "New product"} />
      <Panel>
        <ProductForm product={product} />
      </Panel>
    </>
  );
}
