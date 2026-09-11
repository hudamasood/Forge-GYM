import { CalendarCheck } from "lucide-react";
import { services } from "@/server/container";
import { pageQuerySchema } from "@/server/validation/schemas";
import { BOOKING_STATUSES, type BookingStatus } from "@/server/domain/types";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Pagination, SearchBar } from "@/components/admin/admin-ui";
import { FilterChips } from "@/components/layout/filter-chips";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { BookingStatusBadge } from "@/components/cards/badges";
import { ConfirmActionButton } from "@/components/portal/confirm-action-button";
import { formatDateTime, titleCase } from "@/lib/format";
import { adminCancelBookingAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const query = pageQuerySchema.parse(params);
  const status = BOOKING_STATUSES.includes(params.status as BookingStatus) ? (params.status as BookingStatus) : undefined;
  const result = await services().bookings.listAll({ ...query, status, pageSize: 25 });

  return (
    <>
      <PortalHeader title="Bookings" description="Every class booking across all spaces." />
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          label="Filter by status"
          param="status"
          basePath="/admin/bookings"
          current={status}
          otherParams={{ search: query.search }}
          options={[{ label: "All", value: undefined }, ...BOOKING_STATUSES.map((s) => ({ label: titleCase(s), value: s }))]}
        />
        <SearchBar action="/admin/bookings" defaultValue={query.search} placeholder="Search member email" hidden={{ status }} />
      </div>
      {result.items.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No bookings found" message="Bookings appear here as members reserve classes." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Member</TH>
              <TH>Class</TH>
              <TH>Session</TH>
              <TH>Status</TH>
              <TH className="text-right">
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {result.items.map((b) => (
              <TR key={b.id}>
                <TD>
                  <span className="block font-medium text-bone-50">{b.user.name}</span>
                  <span className="text-xs text-ink-300">{b.user.email}</span>
                </TD>
                <TD>
                  {b.schedule.class.name}
                  <span className="block text-xs text-ink-300">{b.schedule.accessObject.name}</span>
                </TD>
                <TD className="whitespace-nowrap">{formatDateTime(b.schedule.startTime)}</TD>
                <TD>
                  <BookingStatusBadge status={b.status} />
                </TD>
                <TD className="text-right">
                  {b.status === "CONFIRMED" && (
                    <ConfirmActionButton
                      action={adminCancelBookingAction.bind(null, b.id)}
                      label="Cancel"
                      ariaLabel={`Cancel booking for ${b.user.email}`}
                      title="Cancel this booking?"
                      description={`${b.user.name} · ${b.schedule.class.name}, ${formatDateTime(b.schedule.startTime)}. The seat is released immediately.`}
                      confirmLabel="Cancel booking"
                      variant="ghost"
                    />
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} basePath="/admin/bookings" params={{ search: query.search, status }} />
    </>
  );
}
