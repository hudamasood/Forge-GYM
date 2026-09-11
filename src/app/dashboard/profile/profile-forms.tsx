"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input } from "@/components/ui/form";
import { changePasswordAction, updateProfileAction } from "../actions";
import type { ActionState } from "@/server/http/action";

const initial: ActionState = { ok: false };

function Status({ state }: { state: ActionState }) {
  if (state.ok && state.message)
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-success-light">
        <CheckCircle2 className="size-4" aria-hidden /> {state.message}
      </p>
    );
  if (!state.ok && state.error && !Object.keys(state.fieldErrors ?? {}).length) return <FieldError>{state.error}</FieldError>;
  return null;
}

export function ProfileForm({ name, phone, email }: { name: string; phone: string | null; email: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Field label="Email" htmlFor="email" hint="Contact the front desk to change your login email.">
        <Input id="email" value={email} disabled readOnly />
      </Field>
      <Field label="Full name" htmlFor="name" error={errors.name}>
        <Input id="name" name="name" defaultValue={name} autoComplete="name" required />
      </Field>
      <Field label="Phone" htmlFor="phone" error={errors.phone}>
        <Input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} autoComplete="tel" />
      </Field>
      <Status state={state} />
      <Button type="submit" loading={pending} loadingText="Saving…" className="self-start">
        Save profile
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  const ref = useRef<HTMLFormElement>(null);
  const errors = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="flex flex-col gap-5" noValidate>
      <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword}>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="New password" htmlFor="newPassword" hint="At least 8 characters, with a letter and a number." error={errors.newPassword}>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword}>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
      </Field>
      <Status state={state} />
      <Button type="submit" variant="secondary" loading={pending} loadingText="Updating…" className="self-start">
        Update password
      </Button>
    </form>
  );
}
