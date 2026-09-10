/** Only same-origin relative paths are allowed as post-login destinations (prevents open redirects). */
export function safeCallbackUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 500) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (/^\/(api|continue)(\/|$)/.test(value)) return null;
  return value;
}
