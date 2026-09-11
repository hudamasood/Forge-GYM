import { Info } from "lucide-react";
import { requirePageUser } from "@/server/http/session";
import { trainerContext } from "@/server/queries/trainer-portal";
import { PortalHeader } from "@/components/layout/portal-shell";
import { NoTrainerProfile } from "@/components/portal/no-trainer-profile";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Weekly teaching pattern derived from the real timetable. Who owns trainer
 * availability (trainer vs admin) is still an open business decision
 * (spec A7), so this view is read-only.
 */
export default async function TrainerAvailabilityPage() {
  const user = await requirePageUser();
  const ctx = await trainerContext(user.id, 14);
  if (!ctx) return <NoTrainerProfile />;

  const slots = new Map<string, { day: number; label: string; className: string }>();
  for (const s of ctx.sessions) {
    const day = (s.startTime.getUTCDay() + 6) % 7;
    const label = `${formatTime(s.startTime)} – ${formatTime(s.endTime)}`;
    slots.set(`${day}-${label}-${s.class.name}`, { day, label, className: s.class.name });
  }
  const minutes = ctx.sessions.reduce((n, s) => n + (s.endTime.getTime() - s.startTime.getTime()) / 60000, 0);

  return (
    <>
      <PortalHeader title="Availability" description={`Your recurring teaching pattern — about ${Math.round(minutes / 60 / 2)} hours a week.`} />
      <p className="mb-6 flex items-start gap-2 rounded-xl border border-steel-400/30 bg-steel-600/15 p-4 text-sm text-steel-300">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> Availability is managed with the admin team for now. Tell them about changes and they&apos;ll update the timetable.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {DAYS.map((d, i) => {
          const daySlots = [...slots.values()].filter((s) => s.day === i);
          return (
            <section key={d} aria-label={d} className={cn("rounded-2xl border p-4", daySlots.length ? "border-ember-400/25 bg-ember-500/[0.05]" : "border-bone-50/8 bg-ink-800/40")}>
              <h2 className="font-display text-lg text-bone-50">{d}</h2>
              {daySlots.length === 0 ? (
                <p className="mt-2 text-sm text-ink-300">Off</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {daySlots.map((s) => (
                    <li key={`${s.label}-${s.className}`} className="text-sm">
                      <span className="block text-bone-50">{s.label}</span>
                      <span className="text-ink-300">{s.className}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
