"use client";

import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/admin/action-form";
import { TextAreaField, TextField } from "@/components/admin/fields";
import { updateAccessObjectAction, updateSpaceHoursAction } from "../actions";

export function AccessObjectForm({ obj }: { obj: { id: string; name: string; tagline: string; description: string; equipmentList: string[] } }) {
  return (
    <ActionForm action={updateAccessObjectAction.bind(null, obj.id)}>
      {(pending) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="name" label="Name" defaultValue={obj.name} required />
            <TextField name="tagline" label="Tagline" defaultValue={obj.tagline} />
          </div>
          <TextAreaField name="description" label="Description" defaultValue={obj.description} rows={3} required />
          <TextAreaField name="equipmentList" label="Equipment" hint="One item per line." defaultValue={obj.equipmentList.join("\n")} rows={5} />
          <Button type="submit" variant="secondary" loading={pending} loadingText="Saving…" className="self-start">
            Save {obj.name}
          </Button>
        </>
      )}
    </ActionForm>
  );
}

export function SpaceHoursForm({ accessObjectId, name, hours }: { accessObjectId: string; name: string; hours: Record<string, string> }) {
  return (
    <ActionForm action={updateSpaceHoursAction.bind(null, accessObjectId)} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      {(pending) => (
        <>
          <TextField name="weekdays" label="Weekdays" defaultValue={hours.weekdays ?? ""} required />
          <TextField name="weekends" label="Weekends" defaultValue={hours.weekends ?? ""} required />
          <Button type="submit" variant="secondary" loading={pending} loadingText="Saving…" aria-label={`Save hours for ${name}`}>
            Save
          </Button>
        </>
      )}
    </ActionForm>
  );
}
