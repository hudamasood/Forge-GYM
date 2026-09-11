import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { services } from "@/server/container";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Panel } from "@/components/admin/admin-ui";
import { TrainerForm } from "../../entity-forms";

export const dynamic = "force-dynamic";

export default async function EditTrainerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trainers, objects, accounts] = await Promise.all([services().trainers.list(), services().accessObjects.list(), services().users.list({ role: "TRAINER", pageSize: 100 })]);
  const isNew = id === "new";
  const trainer = isNew ? undefined : trainers.find((t) => t.id === id);
  if (!isNew && !trainer) notFound();

  const linkedElsewhere = new Set(trainers.filter((t) => t.id !== trainer?.id && t.userId).map((t) => t.userId));
  const trainerAccounts = accounts.items.filter((u) => !linkedElsewhere.has(u.id)).map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }));

  return (
    <>
      <Link href="/admin/trainers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-300 hover:text-bone-50">
        <ArrowLeft className="size-4" aria-hidden /> All trainers
      </Link>
      <PortalHeader title={trainer ? `Edit ${trainer.name}` : "New trainer"} />
      <Panel>
        <TrainerForm trainer={trainer} accessObjects={objects.map((o) => ({ value: o.id, label: o.name }))} trainerAccounts={trainerAccounts} />
      </Panel>
    </>
  );
}
