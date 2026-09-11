import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";

/** GET search form — works without JavaScript and keeps state in the URL. */
export function SearchBar({ action, defaultValue, placeholder, hidden = {} }: { action: string; defaultValue?: string; placeholder: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form role="search" action={action} className="flex w-full gap-2 sm:w-80">
      {Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label htmlFor="admin-search" className="sr-only">
        {placeholder}
      </label>
      <Input id="admin-search" type="search" name="search" defaultValue={defaultValue} placeholder={placeholder} />
      <Button type="submit" variant="secondary" size="icon" aria-label="Search">
        <Search aria-hidden />
      </Button>
    </form>
  );
}

export function Pagination({ page, pageSize, total, basePath, params = {} }: { page: number; pageSize: number; total: number; basePath: string; params?: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries({ ...params, page: String(p) }).filter((e): e is [string, string] => Boolean(e[1])));
    return `${basePath}?${qs}`;
  };
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4 text-sm text-ink-300">
      <p>
        Page {page} of {pages} · {total} total
      </p>
      <div className="flex gap-2">
        <Button asChild variant="secondary" size="sm" className={cn(page <= 1 && "pointer-events-none opacity-40")}>
          <Link href={href(page - 1)} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined}>
            <ChevronLeft aria-hidden /> Previous
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm" className={cn(page >= pages && "pointer-events-none opacity-40")}>
          <Link href={href(page + 1)} aria-disabled={page >= pages} tabIndex={page >= pages ? -1 : undefined}>
            Next <ChevronRight aria-hidden />
          </Link>
        </Button>
      </div>
    </nav>
  );
}

export function SavedNotice({ show, children = "Saved." }: { show: boolean; children?: React.ReactNode }) {
  if (!show) return null;
  return (
    <p role="status" className="mb-6 rounded-xl border border-success-light/30 bg-success/10 px-4 py-3 text-sm text-success-light">
      {children}
    </p>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-bone-50/8 bg-ink-800/60 p-6", className)} aria-label={title}>
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-xl text-bone-50">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
