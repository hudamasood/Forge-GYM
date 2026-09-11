"use client";

import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useFieldErrors } from "./action-form";

type Common = { name: string; label: string; hint?: string; className?: string };

export function TextField({ name, label, hint, className, ...props }: Common & React.InputHTMLAttributes<HTMLInputElement>) {
  const errors = useFieldErrors();
  return (
    <Field label={label} htmlFor={name} hint={hint} error={errors[name]} className={className}>
      <Input id={name} name={name} {...props} />
    </Field>
  );
}

export function TextAreaField({ name, label, hint, className, ...props }: Common & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const errors = useFieldErrors();
  return (
    <Field label={label} htmlFor={name} hint={hint} error={errors[name]} className={className}>
      <Textarea id={name} name={name} {...props} />
    </Field>
  );
}

export function SelectField({
  name,
  label,
  hint,
  className,
  options,
  ...props
}: Common & React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const errors = useFieldErrors();
  return (
    <Field label={label} htmlFor={name} hint={hint} error={errors[name]} className={className}>
      <Select id={name} name={name} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}
