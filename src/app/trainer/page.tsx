import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { requirePageUser } from "@/server/http/session";
import { trainerContext } from "@/server/queries/trainer-portal";
import { PortalHeader, StatCard } from "@/components/layout/portal-shell";
import { EmptyState } from "@/components/ui/states";
import { NoTrainerProfile } from "@/components/portal/no-trainer-profile";
import { formatDateTime, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TrainerOverviewPage() {
  const user = await requirePageUser();
  const ctx = await trainerContext(user.id, 7);
  if (!ctx) return <NoTrainerProfile />;

  const { trainer, sessions } = ctx;
  const todayKey = new Date().toDateString();
  const today = sessions.filter((s) => s.startTime.toDateString() === todayKey);
  const booked = sessions.reduce((n, s) => n + s.bookedCount, 0);
  const capacity = sessions.reduce((n, s) => n + s.capacity, 0);

  return (
    <>
      <PortalHeader title={`Coach ${trainer.name.split(" ")[0]}`} description="Your week at a glance." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Sessions today" value={today.length} tone="ember" />
        <StatCard label="Sessions this week" value={sessions.length} />
        <StatCard label="Seats filled (7 days)" value={capacity ? `${Math.round((booked / capacity) * 100)}%` : "—"} hint={`${booked} of ${capacity}`} />
      </div>

      <section aria-labelledby="upcoming-heading" className="mt-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="upcoming-heading" className="font-display text-2xl text-bone-50">
            Coming up
          </h2>
          <Link href="/trainer/schedule" className="text-sm text-ember-300 hover:text-ember-100">
            Full schedule
          </Link>
        </div>
        {sessions.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No sessions this week" message="Your timetable is managed by the admin team." />
        ) : (
          <ul className="flex flex-col gap-3">
            {sessions.slice(0, 6).map((s) => (
              <li key={s.id}>
                <Link href={`/trainer/attendance/${s.id}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-bone-50/8 bg-ink-800/60 p-5 hover:border-bone-50/15">
                  <div>
                    <p className="font-display text-xl uppercase text-bone-50 group-hover:text-ember-300">{s.class.name}</p>
                    <p className="text-sm text-ink-300">
                      {formatDateTime(s.startTime)} – {formatTime(s.endTime)} · {s.accessObject.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-bone-200">
                      {s.bookedCount}/{s.capacity} booked
                    </span>
                    <ArrowRight className="size-5 text-ink-300 transition-transform group-hover:translate-x-1" aria-hidden />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
