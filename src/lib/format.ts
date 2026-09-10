const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Formats integer USD cents. */
export function formatUsd(cents: number, options: { whole?: boolean } = {}) {
  const value = cents / 100;
  return options.whole && Number.isInteger(value) ? usdWhole.format(value) : usd.format(value);
}

/** Gym-local timezone for displaying timetables (placeholder until the location is confirmed). */
export const GYM_TIMEZONE = process.env.NEXT_PUBLIC_GYM_TIMEZONE || "UTC";

export function formatDateTime(date: Date | string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: GYM_TIMEZONE,
    ...options,
  }).format(new Date(date));
}

export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: GYM_TIMEZONE, ...options }).format(
    new Date(date),
  );
}

export function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: GYM_TIMEZONE }).format(new Date(date));
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
