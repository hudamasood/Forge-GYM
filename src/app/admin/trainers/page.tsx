import Link from "next/link";
import { Plus, UserX } from "lucide-react";
import { services } from "@/server/container";
import { PortalHeader } from "@/components/layout/portal-shell";
import { SavedNotice } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { ConfirmActionButton } from "@/components/portal/confirm-action-button";
import { deleteTrainerAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminTrainersPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [trainers, { saved }] = await Promise.all([services().trainers.list(), searchParams]);
  return (
    <>
      <PortalHeader
        title="Trainers"
        description="Coach profiles shown on the site, and their link to a trainer login."
        actions={
          <Button asChild>
            <Link href="/admin/trainers/new">
              <Plus aria-hidden /> New trainer
            </Link>
          </Button>
        }
      />
      <SavedNotice show={saved === "1"}>Trainer saved.</SavedNotice>
      {trainers.length === 0 ? (
        <EmptyState icon={UserX} title="No trainers yet" message="Add your first coach." action={{ label: "New trainer", href: "/admin/trainers/new" }} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Trainer</TH>
              <TH>Lead space</TH>
              <TH>Specialty</TH>
              <TH>Portal login</TH>
              <TH className="text-right">
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {trainers.map((t) => (
              <TR key={t.id}>
                <TD>
                  <Link href={`/admin/trainers/${t.id}`} className="font-medium text-bone-50 hover:text-ember-300">
                    {t.name}
                  </Link>
                </TD>
                <TD>{t.primaryAccessObject.name}</TD>
                <TD>{t.specialty}</TD>
                <TD>{t.userId ? <Badge tone="success">Linked</Badge> : <Badge>Not linked</Badge>}</TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/admin/trainers/${t.id}`}>Edit</Link>
                    </Button>
                    <ConfirmActionButton
                      action={deleteTrainerAction.bind(null, t.id)}
                      label="Delete"
                      ariaLabel={`Delete ${t.name}`}
                      title={`Delete ${t.name}?`}
                      description="Trainers with scheduled sessions can't be deleted — reassign or remove their sessions first."
                      confirmLabel="Delete trainer"
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
