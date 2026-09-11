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

/** Minutes the given zone is ahead of UTC at instant `ts`. */
function zoneOffsetMinutes(ts: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ts));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return (Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - ts) / 60_000;
}

/** Converts a wall-clock "YYYY-MM-DDTHH:mm" in the gym's timezone to a UTC Date. */
export function gymLocalToUtc(local: string, timeZone = GYM_TIMEZONE): Date {
  const [datePart, timePart = "00:00"] = local.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = timePart.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  const first = guess - zoneOffsetMinutes(guess, timeZone) * 60_000;
  // Re-evaluate at the corrected instant so DST transitions resolve correctly.
  return new Date(guess - zoneOffsetMinutes(first, timeZone) * 60_000);
}

/** UTC Date → "YYYY-MM-DDTHH:mm" wall clock in the gym's timezone (for datetime-local inputs). */
export function utcToGymLocal(date: Date, timeZone = GYM_TIMEZONE): string {
  const shifted = new Date(date.getTime() + zoneOffsetMinutes(date.getTime(), timeZone) * 60_000);
  return shifted.toISOString().slice(0, 16);
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
