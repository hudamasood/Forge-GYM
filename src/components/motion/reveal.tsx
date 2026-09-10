"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Fades and lifts children into view on scroll. Content is visible without
 * JavaScript and for reduced-motion users; the effect only enhances.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "section";
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [state, setState] = React.useState<"idle" | "hidden" | "shown">("idle");

  React.useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return; // already on screen: no flash
    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      style={{ transitionDelay: state === "shown" ? `${delay}ms` : undefined }}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-[var(--ease-forge)]",
        state === "hidden" && "translate-y-6 opacity-0",
        state === "shown" && "translate-y-0 opacity-100",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
