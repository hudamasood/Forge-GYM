"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { FieldError } from "@/components/ui/form";
import type { ActionState } from "@/server/http/action";

type FormAction = (prev: ActionState, form: FormData) => Promise<ActionState>;

const FieldErrorsContext = React.createContext<Record<string, string[]>>({});

/** Field-level errors from the last submission, for any Field inside an ActionForm. */
export function useFieldErrors() {
  return React.useContext(FieldErrorsContext);
}

/** Server-action form with a status line and field errors distributed via context. */
export function ActionForm({
  action,
  children,
  className,
  onSuccess,
}: {
  action: FormAction;
  children: (pending: boolean) => React.ReactNode;
  className?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false } as ActionState);
  const onSuccessRef = React.useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  React.useEffect(() => {
    if (state.ok) onSuccessRef.current?.();
  }, [state]);

  return (
    <FieldErrorsContext.Provider value={state.fieldErrors ?? {}}>
      <form action={formAction} className={className ?? "flex flex-col gap-5"} noValidate>
        {state.ok && state.message && (
          <p role="status" className="flex items-center gap-2 text-sm text-success-light">
            <CheckCircle2 className="size-4" aria-hidden /> {state.message}
          </p>
        )}
        {!state.ok && state.error && (
          <div className="rounded-lg border border-error-light/30 bg-error/10 px-4 py-3">
            <FieldError>{state.error}</FieldError>
          </div>
        )}
        {children(pending)}
      </form>
    </FieldErrorsContext.Provider>
  );
}
