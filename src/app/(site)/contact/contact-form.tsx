"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Textarea } from "@/components/ui/form";
import { sendContactMessage } from "./actions";
import type { ActionState } from "@/server/http/action";

const initial: ActionState = { ok: false };

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-5" noValidate>
      {state.ok && state.message && (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-success-light/30 bg-success/10 px-4 py-3 text-sm text-success-light">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden /> {state.message}
        </p>
      )}
      {!state.ok && state.error && !Object.keys(errors).length && (
        <div className="rounded-lg border border-error-light/30 bg-error/10 px-4 py-3">
          <FieldError>{state.error}</FieldError>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={errors.name}>
          <Input id="name" name="name" autoComplete="name" required />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
      </div>
      <Field label="Subject" htmlFor="subject" error={errors.subject}>
        <Input id="subject" name="subject" required />
      </Field>
      <Field label="Message" htmlFor="message" error={errors.message}>
        <Textarea id="message" name="message" rows={6} required />
      </Field>
      {/* Honeypot for bots — hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <Button type="submit" size="lg" loading={pending} loadingText="Sending…" className="self-start">
        Send message
      </Button>
    </form>
  );
}
