import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

/**
 * Every variant ships default / hover / focus-visible / active / disabled /
 * loading states (spec B4). The ember gradient is reserved for `primary`.
 */
export const buttonVariants = cva(
  // Long labels may wrap on phones (min-h, not h) instead of pushing the page wider than the screen.
  "relative inline-flex select-none items-center justify-center gap-2 text-center text-balance whitespace-normal sm:whitespace-nowrap rounded-lg font-medium tracking-wide transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-[var(--ease-forge)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-400 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-ember-gradient text-bone-50 shadow-warm hover:brightness-110 hover:shadow-warm-lg active:brightness-95",
        secondary: "border border-bone-50/15 bg-ink-800 text-bone-50 hover:border-bone-50/30 hover:bg-ink-700 active:bg-ink-600",
        ghost: "text-bone-100 hover:bg-bone-50/5 hover:text-bone-50 active:bg-bone-50/10",
        outline: "border border-ember-400/60 text-ember-300 hover:border-ember-400 hover:bg-ember-500/10 active:bg-ember-500/20",
        danger: "bg-error text-bone-50 hover:bg-error/90 active:bg-error/80",
        light: "bg-bone-50 text-ink-900 hover:bg-bone-100 active:bg-bone-200",
      },
      size: {
        sm: "min-h-9 px-3.5 py-1.5 text-sm",
        md: "min-h-11 px-5 py-2 text-sm",
        lg: "min-h-13 px-7 py-2.5 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, disabled, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (loadingText ? <span aria-hidden className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : <Spinner className="size-4" />)}
        {loading && loadingText ? loadingText : children}
      </button>
    );
  },
);
Button.displayName = "Button";
