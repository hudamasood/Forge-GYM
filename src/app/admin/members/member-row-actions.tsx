"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActionForm } from "@/components/admin/action-form";
import { SelectField, TextField } from "@/components/admin/fields";
import { ConfirmActionButton } from "@/components/portal/confirm-action-button";
import { deleteMemberAction, updateMemberAction } from "../actions";
import type { Role } from "@/server/domain/types";

export function MemberRowActions({ user, isSelf }: { user: { id: string; name: string; phone: string | null; role: Role; email: string }; isSelf: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)} aria-label={`Edit ${user.email}`}>
        Edit
      </Button>
      {!isSelf && (
        <ConfirmActionButton
          action={deleteMemberAction.bind(null, user.id)}
          label="Delete"
          ariaLabel={`Delete ${user.email}`}
          title={`Delete ${user.name}?`}
          description="Permanently removes the account with its bookings and memberships. Accounts with store orders can't be deleted — they are kept for accounting. This cannot be undone."
          confirmLabel="Delete account"
          variant="ghost"
        />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {user.name}</DialogTitle>
          </DialogHeader>
          <ActionForm
            action={updateMemberAction.bind(null, user.id)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
          >
            {(pending) => (
              <>
                <TextField name="name" label="Name" defaultValue={user.name} required />
                <TextField name="phone" label="Phone" defaultValue={user.phone ?? ""} />
                <SelectField
                  name="role"
                  label="Role"
                  defaultValue={user.role}
                  disabled={isSelf}
                  hint={isSelf ? "You can't change your own role." : "Trainers also need a linked trainer profile (Admin → Trainers)."}
                  options={[
                    { value: "MEMBER", label: "Member" },
                    { value: "TRAINER", label: "Trainer" },
                    { value: "ADMIN", label: "Admin" },
                  ]}
                />
                {isSelf && <input type="hidden" name="role" value={user.role} />}
                <Button type="submit" loading={pending} loadingText="Saving…" className="self-end">
                  Save changes
                </Button>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </div>
  );
}
