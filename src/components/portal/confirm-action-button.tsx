"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

type ActionResult = { ok: boolean; message?: string; error?: string };

/** A destructive/irreversible action behind an explicit confirmation dialog. */
export function ConfirmActionButton({
  action,
  label,
  title,
  description,
  confirmLabel,
  variant = "secondary",
  size = "sm",
  ariaLabel,
}: {
  action: () => Promise<ActionResult>;
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  ariaLabel?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const confirm = () =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast({ tone: "success", title: result.message ?? "Done" });
        setOpen(false);
        router.refresh();
      } else {
        toast({ tone: "error", title: "That didn't work", description: result.error });
      }
    });

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)} aria-label={ariaLabel}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Keep it
            </Button>
            <Button variant="danger" onClick={confirm} loading={pending} loadingText="Working…">
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
