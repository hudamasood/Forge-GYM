import "server-only";
import { isDomainError } from "@/server/domain/errors";

export interface ActionState {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialActionState: ActionState = { ok: false };

/** Runs a Server Action body, converting domain errors into form state. Redirects still propagate. */
export async function runAction(body: () => Promise<string | void>): Promise<ActionState> {
  try {
    const message = await body();
    return { ok: true, message: message ?? undefined };
  } catch (error) {
    if (isNextControlFlow(error)) throw error;
    if (isDomainError(error)) return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    console.error("[action] unhandled error", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/** redirect()/notFound() throw special errors that must not be swallowed. */
function isNextControlFlow(error: unknown) {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK") || digest === "NEXT_NOT_FOUND");
}
