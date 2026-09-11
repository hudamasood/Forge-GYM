import { CalendarDays } from "lucide-react";
import { services } from "@/server/container";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Panel } from "@/components/admin/admin-ui";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { ConfirmActionButton } from "@/components/portal/confirm-action-button";
import { formatDateTime, formatTime } from "@/lib/format";
import { deleteScheduleAction } from "../actions";
import { ScheduleForm } from "./schedule-form";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  const { classes, trainers, accessObjects, schedules } = services();
  const now = new Date();
  const [classList, trainerList, objects, upcoming] = await Promise.all([
    classes.list(),
    trainers.list(),
    accessObjects.list(),
    schedules.listUpcoming({ from: now, to: new Date(now.getTime() + 14 * 86_400_000) }),
  ]);

  return (
    <>
      <PortalHeader title="Schedule" description="Add sessions to the timetable. Trainer and space double-bookings are rejected automatically." />
      <Panel title="Add a session" className="mb-8">
        <ScheduleForm
          classes={classList.map((c) => ({ id: c.id, name: c.name, accessObjectId: c.accessObjectId, durationMinutes: c.durationMinutes, accessObjectName: c.accessObject.name }))}
          trainers={trainerList.map((t) => ({ id: t.id, name: t.name, primaryAccessObjectId: t.primaryAccessObjectId }))}
          spaces={objects.filter((o) => o.space).map((o) => ({ id: o.space!.id, accessObjectId: o.id, name: o.name }))}
        />
      </Panel>

      <h2 className="mb-4 font-display text-2xl text-bone-50">Next 14 days</h2>
      {upcoming.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nothing scheduled" message="Add a session above to publish it on the timetable." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>When</TH>
              <TH>Class</TH>
              <TH>Coach</TH>
              <TH>Space</TH>
              <TH>Booked</TH>
              <TH className="text-right">
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {upcoming.map((s) => (
              <TR key={s.id}>
                <TD className="whitespace-nowrap text-bone-50">
                  {formatDateTime(s.startTime)} – {formatTime(s.endTime)}
                </TD>
                <TD>{s.class.name}</TD>
                <TD>{s.trainer.name}</TD>
                <TD>{s.accessObject.name}</TD>
                <TD>
                  {s.bookedCount}/{s.capacity}
                </TD>
                <TD className="text-right">
                  <ConfirmActionButton
                    action={deleteScheduleAction.bind(null, s.id)}
                    label="Remove"
                    ariaLabel={`Remove ${s.class.name} on ${formatDateTime(s.startTime)}`}
                    title="Remove this session?"
                    description={s.bookedCount > 0 ? "This session has bookings — cancel them under Bookings before removing it." : "The session disappears from the public timetable."}
                    confirmLabel="Remove session"
                    variant="ghost"
                  />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
