import { ShoppingBag } from "lucide-react";
import { services } from "@/server/container";
import { requirePageUser } from "@/server/http/session";
import { PortalHeader } from "@/components/layout/portal-shell";
import { EmptyState } from "@/components/ui/states";
import { OrderStatusBadge } from "@/components/cards/badges";
import { formatDate, formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requirePageUser();
  const orders = await services().orders.listForUser(user.id);

  return (
    <>
      <PortalHeader title="Orders" description="Everything you've bought from the FORGE store." />
      {orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders yet" message="Supplements, equipment and FORGE gear — picked by our coaches." action={{ label: "Visit the store", href: "/store" }} />
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-2xl border border-bone-50/8 bg-ink-800/60 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-lg text-bone-50">Order #{o.id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm text-ink-300">{formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={o.status} />
                  <span className="font-display text-2xl text-bone-50">{formatUsd(o.total)}</span>
                </div>
              </div>
              <ul className="mt-4 divide-y divide-bone-50/6 border-t border-bone-50/8 text-sm">
                {o.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3 py-2.5">
                    <span className="text-bone-100">
                      {i.quantity} × {i.product?.name ?? "Item"}
                    </span>
                    <span className="text-bone-200">{formatUsd(i.unitPriceAtPurchase * i.quantity)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
