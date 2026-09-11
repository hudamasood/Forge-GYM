"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { titleCase } from "@/lib/format";

/** Inline status changer for admin tables (orders, memberships). */
export function StatusSelect({
  value,
  options,
  action,
  label,
}: {
  value: string;
  options: readonly string[];
  action: (status: string) => Promise<{ ok: boolean; message?: string; error?: string }>;
  label: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = React.useTransition();
  const [current, setCurrent] = React.useState(value);

  return (
    <Select
      aria-label={label}
      value={current}
      disabled={pending}
      className="h-9 w-40 text-xs"
      onChange={(e) => {
        const next = e.target.value;
        const previous = current;
        setCurrent(next);
        startTransition(async () => {
          const result = await action(next);
          if (result.ok) {
            toast({ tone: "success", title: result.message ?? "Updated" });
            router.refresh();
          } else {
            setCurrent(previous);
            toast({ tone: "error", title: "Update failed", description: result.error });
          }
        });
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {titleCase(o)}
        </option>
      ))}
    </Select>
  );
}
