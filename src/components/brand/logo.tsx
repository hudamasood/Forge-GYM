import Link from "next/link";
import { cn } from "@/lib/utils";

/** Placeholder wordmark — swap for the final logo mark once decided (spec A3). */
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5 rounded-md", className)} aria-label="FORGE home">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <defs>
          <linearGradient id="forge-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#dd5a22" />
            <stop offset="1" stopColor="#a3360a" />
          </linearGradient>
        </defs>
        <path d="M4 4h24v6H11v5h13v6H11v7H4z" fill="url(#forge-mark)" />
        <path d="M22 22h6v6h-6z" fill="#faf8f4" className="transition-transform duration-300 group-hover:translate-x-0.5" />
      </svg>
      <span className="font-display text-2xl font-semibold tracking-[0.18em] text-bone-50">FORGE</span>
    </Link>
  );
}
