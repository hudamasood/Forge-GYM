import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-lg border bg-ink-900/70 px-3.5 text-sm text-bone-50 placeholder:text-ink-400 transition-colors duration-150 hover:border-bone-50/25 focus-visible:border-ember-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ember-400/40 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-error-light/70";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, "h-11 border-bone-50/12", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, "min-h-28 border-bone-50/12 py-3", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      fieldBase,
      "h-11 appearance-none border-bone-50/12 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23a39e94%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[position:right_0.9rem_center] bg-no-repeat pr-9",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-bone-100", className)} {...props} />;
}

export function Checkbox({ className, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-sm text-bone-100", className)}>
      <input
        type="checkbox"
        className="size-4 cursor-pointer rounded border-bone-50/30 bg-ink-900 accent-ember-500 focus-visible:outline-2 focus-visible:outline-ember-400"
        {...props}
      />
      {label}
    </label>
  );
}

/** Error text uses color + icon + words — never color alone (spec B4). */
export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="flex items-center gap-1.5 text-sm text-error-light">
      <AlertCircle className="size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

/** Label + control + hint + error, wired together with ids for assistive tech. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | string[];
  className?: string;
  children: React.ReactElement<{ "aria-invalid"?: boolean; "aria-describedby"?: string }>;
}) {
  const message = Array.isArray(error) ? error[0] : error;
  const describedBy = [hint && `${htmlFor}-hint`, message && `${htmlFor}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {React.cloneElement(children, { "aria-invalid": message ? true : undefined, "aria-describedby": describedBy })}
      {hint && !message && (
        <p id={`${htmlFor}-hint`} className="text-xs text-ink-300">
          {hint}
        </p>
      )}
      <FieldError id={`${htmlFor}-error`}>{message}</FieldError>
    </div>
  );
}
