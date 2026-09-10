import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide whitespace-nowrap", {
  variants: {
    tone: {
      neutral: "border-bone-50/15 bg-bone-50/5 text-bone-200",
      ember: "border-ember-400/40 bg-ember-500/15 text-ember-300",
      steel: "border-steel-400/40 bg-steel-600/25 text-steel-300",
      success: "border-success-light/40 bg-success/20 text-success-light",
      warning: "border-warning-light/40 bg-warning/20 text-warning-light",
      error: "border-error-light/40 bg-error/20 text-error-light",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
