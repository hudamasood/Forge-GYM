import { ReceiptText } from "lucide-react";
import { services } from "@/server/container";
import { pageQuerySchema } from "@/server/validation/schemas";
import { ORDER_STATUSES, type OrderStatus } from "@/server/domain/types";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Pagination, SearchBar } from "@/components/admin/admin-ui";
import { FilterChips } from "@/components/layout/filter-chips";
import { StatusSelect } from "@/components/admin/status-select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { formatDate, formatUsd, titleCase } from "@/lib/format";
import { setOrderStatusAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const query = pageQuerySchema.parse(params);
  const status = ORDER_STATUSES.includes(params.status as OrderStatus) ? (params.status as OrderStatus) : undefined;
  const result = await services().orders.listAll({ ...query, status, pageSize: 20 });

  return (
    <>
      <PortalHeader title="Orders" description="Store orders. Mark physical orders fulfilled once they're handed over or shipped (fulfilment is manual for now)." />
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          label="Filter by status"
          param="status"
          basePath="/admin/orders"
          current={status}
          otherParams={{ search: query.search }}
          options={[{ label: "All", value: undefined }, ...ORDER_STATUSES.map((s) => ({ label: titleCase(s), value: s }))]}
        />
        <SearchBar action="/admin/orders" defaultValue={query.search} placeholder="Search customer email" hidden={{ status }} />
      </div>
      {result.items.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No orders found" message="Orders appear here as members check out." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Order</TH>
              <TH>Customer</TH>
              <TH>Items</TH>
              <TH>Total</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {result.items.map((o) => (
              <TR key={o.id}>
                <TD>
                  <span className="block font-medium text-bone-50">#{o.id.slice(-8).toUpperCase()}</span>
                  <span className="text-xs text-ink-300">{formatDate(o.createdAt)}</span>
                </TD>
                <TD>
                  {o.user.name}
                  <span className="block text-xs text-ink-300">{o.user.email}</span>
                </TD>
                <TD className="max-w-xs text-sm">
                  {o.items.map((i) => `${i.quantity} × ${i.product?.name ?? "Item"}`).join(", ")}
                  {o.shippingAddress && <span className="block text-xs text-ink-300">Ship to: {Object.values(o.shippingAddress).join(", ")}</span>}
                </TD>
                <TD className="font-medium text-bone-50">{formatUsd(o.total)}</TD>
                <TD>
                  <StatusSelect value={o.status} options={ORDER_STATUSES} action={setOrderStatusAction.bind(null, o.id)} label={`Status for order ${o.id.slice(-8)}`} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} basePath="/admin/orders" params={{ search: query.search, status }} />
    </>
  );
}
