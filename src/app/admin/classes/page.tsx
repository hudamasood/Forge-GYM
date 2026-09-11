import Link from "next/link";
import { Dumbbell, Plus } from "lucide-react";
import { services } from "@/server/container";
import { PortalHeader } from "@/components/layout/portal-shell";
import { SavedNotice } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { DifficultyBadge } from "@/components/cards/badges";
import { ConfirmActionButton } from "@/components/portal/confirm-action-button";
import { deleteClassAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminClassesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [classes, { saved }] = await Promise.all([services().classes.list(), searchParams]);
  return (
    <>
      <PortalHeader
        title="Classes"
        description="Class formats. Schedule sessions for them under Schedule."
        actions={
          <Button asChild>
            <Link href="/admin/classes/new">
              <Plus aria-hidden /> New class
            </Link>
          </Button>
        }
      />
      <SavedNotice show={saved === "1"}>Class saved.</SavedNotice>
      {classes.length === 0 ? (
        <EmptyState icon={Dumbbell} title="No classes yet" message="Create your first class format." action={{ label: "New class", href: "/admin/classes/new" }} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Class</TH>
              <TH>Space</TH>
              <TH>Level</TH>
              <TH>Duration</TH>
              <TH>Capacity</TH>
              <TH className="text-right">
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {classes.map((c) => (
              <TR key={c.id}>
                <TD>
                  <Link href={`/admin/classes/${c.id}`} className="font-medium text-bone-50 hover:text-ember-300">
                    {c.name}
                  </Link>
                  <span className="block text-xs text-ink-300">/classes/{c.slug}</span>
                </TD>
                <TD>{c.accessObject.name}</TD>
                <TD>
                  <DifficultyBadge difficulty={c.difficulty} />
                </TD>
                <TD>{c.durationMinutes} min</TD>
                <TD>{c.defaultCapacity}</TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/admin/classes/${c.id}`}>Edit</Link>
                    </Button>
                    <ConfirmActionButton
                      action={deleteClassAction.bind(null, c.id)}
                      label="Delete"
                      ariaLabel={`Delete ${c.name}`}
                      title={`Delete ${c.name}?`}
                      description="Only classes with no scheduled sessions can be deleted. Remove its sessions under Schedule first."
                      confirmLabel="Delete class"
                      variant="ghost"
                    />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
