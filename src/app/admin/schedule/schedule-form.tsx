"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/admin/action-form";
import { SelectField, TextField } from "@/components/admin/fields";
import { GYM_TIMEZONE, gymLocalToUtc } from "@/lib/format";
import { createScheduleAction } from "../actions";

interface ClassOption {
  id: string;
  name: string;
  accessObjectId: string;
  durationMinutes: number;
  accessObjectName: string;
}

export function ScheduleForm({
  classes,
  trainers,
  spaces,
}: {
  classes: ClassOption[];
  trainers: { id: string; name: string; primaryAccessObjectId: string }[];
  spaces: { id: string; accessObjectId: string; name: string }[];
}) {
  const router = useRouter();
  const [classId, setClassId] = React.useState(classes[0]?.id ?? "");
  const [start, setStart] = React.useState("");
  const selected = classes.find((c) => c.id === classId);
  const space = spaces.find((s) => s.accessObjectId === selected?.accessObjectId);
  const suggested = trainers.find((t) => t.primaryAccessObjectId === selected?.accessObjectId);
  const startUtc = start ? gymLocalToUtc(start) : null;
  const endUtc = startUtc && selected ? new Date(startUtc.getTime() + selected.durationMinutes * 60_000) : null;

  return (
    <ActionForm action={createScheduleAction} onSuccess={() => router.refresh()} className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_1.2fr_1.2fr_0.8fr_auto] xl:items-end">
      {(pending) => (
        <>
          <SelectField
            name="classId"
            label="Class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            options={classes.map((c) => ({ value: c.id, label: `${c.name} · ${c.accessObjectName}` }))}
          />
          <SelectField name="trainerId" label="Coach" key={classId} defaultValue={suggested?.id} options={trainers.map((t) => ({ value: t.id, label: t.name }))} />
          <TextField
            name="startLocal"
            label={`Start (${GYM_TIMEZONE})`}
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            hint={selected ? `${selected.durationMinutes} min · ${space?.name ?? "no space"}` : undefined}
            required
          />
          <TextField name="capacityOverride" label="Capacity" type="number" min={1} max={200} placeholder="Default" />
          <input type="hidden" name="spaceId" value={space?.id ?? ""} />
          <input type="hidden" name="startTime" value={startUtc?.toISOString() ?? ""} />
          <input type="hidden" name="endTime" value={endUtc?.toISOString() ?? ""} />
          <Button type="submit" loading={pending} loadingText="Adding…" disabled={!startUtc || !space}>
            Add session
          </Button>
        </>
      )}
    </ActionForm>
  );
}
