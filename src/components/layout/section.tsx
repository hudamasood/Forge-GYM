import * as React from "react";
import { cn } from "@/lib/utils";

export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8", className)} {...props} />;
}

export function Section({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("py-20 sm:py-28", className)} {...props} />;
}

export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("flex items-center gap-3 font-display text-xs font-medium tracking-[0.3em] text-ember-400 uppercase", className)} {...props}>
      <span aria-hidden className="h-px w-8 bg-ember-400/70" />
      {props.children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Tag = "h2",
  className,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-4", align === "center" && "items-center text-center", className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Tag className={cn("text-balance font-semibold text-bone-50", Tag === "h1" ? "text-5xl sm:text-6xl lg:text-7xl" : "text-4xl sm:text-5xl")}>{title}</Tag>
      {description && <p className={cn("max-w-2xl text-lg leading-relaxed text-ink-300", align === "center" && "mx-auto")}>{description}</p>}
      {children}
    </div>
  );
}

/** Page hero used by every top-level public page. Holds the page's single <h1>. */
export function PageHero({ eyebrow, title, description, children }: { eyebrow: string; title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="grain relative overflow-hidden border-b border-bone-50/6">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_85%_0%,rgba(194,65,12,0.28),transparent_70%)]" />
      <Container className="flex flex-col gap-6 pb-16 pt-14 sm:pb-20 sm:pt-20">
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} description={description} className="animate-fade-up" />
        {children}
      </Container>
    </div>
  );
}
