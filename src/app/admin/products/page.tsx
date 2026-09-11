import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { services } from "@/server/container";
import { PortalHeader } from "@/components/layout/portal-shell";
import { SavedNotice } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { ConfirmActionButton } from "@/components/portal/confirm-action-button";
import { LOW_STOCK_THRESHOLD } from "@/server/services/admin-services";
import { formatUsd, titleCase } from "@/lib/format";
import { deleteProductAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [products, { saved }] = await Promise.all([services().orders.listProducts(), searchParams]);
  return (
    <>
      <PortalHeader
        title="Products"
        description="Store catalog and stock. Stock is decremented automatically when an order is paid."
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus aria-hidden /> New product
            </Link>
          </Button>
        }
      />
      <SavedNotice show={saved === "1"}>Product saved.</SavedNotice>
      {products.length === 0 ? (
        <EmptyState icon={Package} title="No products yet" message="Add your first product." action={{ label: "New product", href: "/admin/products/new" }} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Product</TH>
              <TH>Category</TH>
              <TH>Price</TH>
              <TH>Stock</TH>
              <TH className="text-right">
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {products.map((p) => {
              const digital = p.category === "DIGITAL";
              return (
                <TR key={p.id}>
                  <TD>
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-bone-50 hover:text-ember-300">
                      {p.name}
                    </Link>
                  </TD>
                  <TD>{titleCase(p.category)}</TD>
                  <TD>{formatUsd(p.price)}</TD>
                  <TD>
                    {digital ? (
                      <Badge tone="steel">Digital</Badge>
                    ) : p.stock <= 0 ? (
                      <Badge tone="error">Out of stock</Badge>
                    ) : p.stock <= LOW_STOCK_THRESHOLD ? (
                      <Badge tone="warning">{p.stock} · low</Badge>
                    ) : (
                      p.stock
                    )}
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/admin/products/${p.id}`}>Edit</Link>
                      </Button>
                      <ConfirmActionButton
                        action={deleteProductAction.bind(null, p.id)}
                        label="Delete"
                        ariaLabel={`Delete ${p.name}`}
                        title={`Delete ${p.name}?`}
                        description="Products that appear in past orders can't be deleted — set their stock to 0 to stop selling them."
                        confirmLabel="Delete product"
                        variant="ghost"
                      />
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </>
  );
}
