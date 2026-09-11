import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { requirePageUser } from "@/server/http/session";
import { trainerContext } from "@/server/queries/trainer-portal";
import { PortalHeader } from "@/components/layout/portal-shell";
import { EmptyState } from "@/components/ui/states";
import { NoTrainerProfile } from "@/components/portal/no-trainer-profile";
import { formatDate, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TrainerSchedulePage() {
  const user = await requirePageUser();
  const ctx = await trainerContext(user.id, 14);
  if (!ctx) return <NoTrainerProfile />;

  const byDay = new Map<string, typeof ctx.sessions>();
  for (const s of ctx.sessions) {
    const key = formatDate(s.startTime, { weekday: "long", month: "long", day: "numeric", year: undefined });
    byDay.set(key, [...(byDay.get(key) ?? []), s]);
  }

  return (
    <>
      <PortalHeader title="Schedule" description="Your next 14 days. Changes to the timetable are made by the admin team." />
      {ctx.sessions.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nothing scheduled" message="No sessions in the next two weeks." />
      ) : (
        <div className="flex flex-col gap-8">
          {[...byDay].map(([day, sessions]) => (
            <section key={day} aria-label={day}>
              <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-ember-300">{day}</h2>
              <ul className="divide-y divide-bone-50/6 overflow-hidden rounded-2xl border border-bone-50/8">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <Link href={`/trainer/attendance/${s.id}`} className="grid gap-2 bg-ink-800/40 p-4 transition-colors hover:bg-ink-800 sm:grid-cols-[9rem_1fr_auto] sm:items-center">
                      <span className="font-display text-lg text-bone-50">
                        {formatTime(s.startTime)} – {formatTime(s.endTime)}
                      </span>
                      <span className="text-bone-100">
                        {s.class.name} <span className="text-ink-300">· {s.accessObject.name}</span>
                      </span>
                      <span className="text-sm text-bone-200">
                        {s.bookedCount}/{s.capacity} booked
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
