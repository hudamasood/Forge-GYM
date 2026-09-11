import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { services } from "@/server/container";
import { requirePageUser } from "@/server/http/session";
import { PortalHeader } from "@/components/layout/portal-shell";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { NoTrainerProfile } from "@/components/portal/no-trainer-profile";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const user = await requirePageUser();
  const trainer = await services().trainers.findByUserId(user.id);
  if (!trainer) return <NoTrainerProfile />;

  const now = Date.now();
  const sessions = await services().schedules.listUpcoming({ from: new Date(now - 7 * 86_400_000), to: new Date(now + 2 * 86_400_000), trainerId: trainer.id });
  const ordered = [...sessions].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  return (
    <>
      <PortalHeader title="Attendance" description="Open a session to see its roster and mark who showed up." />
      {ordered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No recent sessions" message="Sessions from the last week and the next two days appear here." />
      ) : (
        <ul className="divide-y divide-bone-50/6 overflow-hidden rounded-2xl border border-bone-50/8">
          {ordered.map((s) => {
            const past = s.startTime.getTime() < now;
            return (
              <li key={s.id}>
                <Link href={`/trainer/attendance/${s.id}`} className="flex flex-wrap items-center justify-between gap-3 bg-ink-800/40 p-4 transition-colors hover:bg-ink-800">
                  <span>
                    <span className="block font-medium text-bone-50">{s.class.name}</span>
                    <span className="text-sm text-ink-300">{formatDateTime(s.startTime)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm text-bone-200">{s.bookedCount} booked</span>
                    <Badge tone={past ? "steel" : "ember"}>{past ? "Past" : "Upcoming"}</Badge>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
