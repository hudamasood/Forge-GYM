import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string | undefined;
}

/**
 * Server-rendered filter chips: plain links, so filtering works without
 * JavaScript and every state is a shareable URL (canonical stays on the base path).
 */
export function FilterChips({
  label,
  param,
  options,
  current,
  basePath,
  otherParams = {},
}: {
  label: string;
  param: string;
  options: FilterOption[];
  current: string | undefined;
  basePath: string;
  otherParams?: Record<string, string | undefined>;
}) {
  const hrefFor = (value: string | undefined) => {
    const params = new URLSearchParams(Object.entries({ ...otherParams, [param]: value }).filter((e): e is [string, string] => Boolean(e[1])));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav aria-label={label} className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {options.map((option) => {
          const active = option.value === current;
          return (
            <li key={option.label}>
              <Link
                href={hrefFor(option.value)}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                  active ? "border-ember-400 bg-ember-500/15 text-ember-100" : "border-bone-50/12 text-bone-200 hover:border-bone-50/30 hover:text-bone-50",
                )}
              >
                {option.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
