import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { services } from "@/server/container";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Panel } from "@/components/admin/admin-ui";
import { ClassForm } from "../../entity-forms";

export const dynamic = "force-dynamic";

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [classes, objects] = await Promise.all([services().classes.list(), services().accessObjects.list()]);
  const isNew = id === "new";
  const gymClass = isNew ? undefined : classes.find((c) => c.id === id);
  if (!isNew && !gymClass) notFound();

  return (
    <>
      <Link href="/admin/classes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-300 hover:text-bone-50">
        <ArrowLeft className="size-4" aria-hidden /> All classes
      </Link>
      <PortalHeader title={gymClass ? `Edit ${gymClass.name}` : "New class"} />
      <Panel>
        <ClassForm gymClass={gymClass} accessObjects={objects.map((o) => ({ value: o.id, label: o.name }))} />
      </Panel>
    </>
  );
}
