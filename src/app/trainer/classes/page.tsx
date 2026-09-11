import { Dumbbell } from "lucide-react";
import { services } from "@/server/container";
import { requirePageUser } from "@/server/http/session";
import { PortalHeader } from "@/components/layout/portal-shell";
import { ClassCard } from "@/components/cards/class-card";
import { EmptyState } from "@/components/ui/states";
import { NoTrainerProfile } from "@/components/portal/no-trainer-profile";

export const dynamic = "force-dynamic";

export default async function TrainerClassesPage() {
  const user = await requirePageUser();
  const trainer = await services().trainers.findByUserId(user.id);
  if (!trainer) return <NoTrainerProfile />;
  const { classes } = await services().trainers.getBySlug(trainer.slug);

  return (
    <>
      <PortalHeader title="My classes" description="Class formats you're scheduled to teach." />
      {classes.length === 0 ? (
        <EmptyState icon={Dumbbell} title="No classes assigned" message="Once the admin team schedules you, your classes appear here." />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => (
            <li key={c.slug}>
              <ClassCard gymClass={c} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
