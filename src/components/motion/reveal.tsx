import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-linked entrance (CSS `animation-timeline: view()`). Pure CSS, so
 * content is always visible: browsers without scroll-driven animations, and
 * reduced-motion users, simply see it in place.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** Stagger in ms; mapped onto the scroll range. */
  delay?: number;
  as?: "div" | "li" | "section";
}) {
  return (
    <Tag className={cn("reveal", className)} style={{ "--reveal-offset": `${Math.min(delay / 20, 20)}%` } as React.CSSProperties}>
      {children}
    </Tag>
  );
}
