"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input } from "@/components/ui/form";
import { forgotPasswordAction, loginAction, resetPasswordAction, signupAction } from "./actions";
import type { ActionState } from "@/server/http/action";

const initial: ActionState = { ok: false };

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-11" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-ink-300 hover:text-bone-50"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}

function FormAlert({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return (
    <div className="rounded-lg border border-error-light/30 bg-error/10 px-4 py-3">
      <FieldError>{state.error}</FieldError>
    </div>
  );
}

export function LoginForm({ callbackUrl, notice }: { callbackUrl?: string; notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {notice && <p className="rounded-lg border border-success-light/30 bg-success/10 px-4 py-3 text-sm text-success-light">{notice}</p>}
      <FormAlert state={state} />
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-bone-100">
            Password
          </label>
          <Link href="/forgot" className="rounded text-sm text-ember-300 hover:text-ember-100">
            Forgot password?
          </Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </div>
      <Button type="submit" size="lg" loading={pending} loadingText="Signing in…">
        Log in
      </Button>
    </form>
  );
}

export function SignupForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(signupAction, initial);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormAlert state={state} />
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <Field label="Full name" htmlFor="name" error={errors.name}>
        <Input id="name" name="name" autoComplete="name" required autoFocus />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Phone (optional)" htmlFor="phone" error={errors.phone}>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters, with a letter and a number." error={errors.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Button type="submit" size="lg" loading={pending} loadingText="Creating account…">
        Create account
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initial);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormAlert state={state} />
      <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Button type="submit" size="lg" loading={pending} loadingText="Sending…">
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initial);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormAlert state={state} />
      <input type="hidden" name="token" value={token} />
      <Field label="New password" htmlFor="password" hint="At least 8 characters, with a letter and a number." error={errors.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" required autoFocus />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword}>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required />
      </Field>
      <Button type="submit" size="lg" loading={pending} loadingText="Saving…">
        Set new password
      </Button>
    </form>
  );
}
