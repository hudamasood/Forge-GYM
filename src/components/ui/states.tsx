import * as React from "react";
import Link from "next/link";
import { AlertTriangle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-lg", className)} />;
}

/** One skeleton per card type (spec B4). */
export function CardSkeleton({ variant = "class" }: { variant?: "class" | "trainer" | "product" | "plan" }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-bone-50/8 bg-ink-800/80" aria-hidden>
      {variant !== "plan" && <Skeleton className={cn("rounded-none", variant === "trainer" ? "aspect-[4/5]" : "aspect-[4/3]")} />}
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        {variant === "plan" && <Skeleton className="mt-4 h-10 w-full" />}
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6, variant }: { count?: number; variant?: "class" | "trainer" | "product" | "plan" }) {
  return (
    <div role="status" aria-label="Loading" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} variant={variant} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-4 rounded-2xl border border-dashed border-bone-50/12 px-6 py-14 text-center", className)}>
      <span className="grid size-14 place-items-center rounded-full bg-ember-500/10 text-ember-400">
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <p className="font-display text-xl uppercase text-bone-50">{title}</p>
        <p className="text-sm text-ink-300">{message}</p>
      </div>
      {action && (
        <Button asChild variant="secondary">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border border-error-light/25 bg-error/5 px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-error/15 text-error-light">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <p className="font-display text-xl uppercase text-bone-50">{title}</p>
        <p className="text-sm text-ink-300">{message ?? "We couldn't load this right now. Please try again."}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
