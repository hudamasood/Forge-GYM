import "server-only";
import { NextResponse } from "next/server";
import { ValidationError, isDomainError } from "@/server/domain/errors";

export interface ApiErrorBody {
  error: { code: string; message: string; fieldErrors?: Record<string, string[]> };
}

/** Maps any thrown error to a JSON response. Unknown errors never leak details. */
export function errorResponse(error: unknown) {
  if (isDomainError(error)) {
    const body: ApiErrorBody = {
      error: { code: error.code, message: error.message, ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}) },
    };
    return NextResponse.json(body, { status: error.status });
  }
  console.error("[api] unhandled error", error);
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } } satisfies ApiErrorBody, { status: 500 });
}

type Handler<C> = (request: Request, context: C) => Promise<Response | unknown>;

/**
 * Thin controller wrapper (spec B1): the handler parses input, calls one
 * service method and returns data; errors map to HTTP status in one place.
 */
export function apiHandler<C = unknown>(handler: Handler<C>) {
  return async (request: Request, context: C) => {
    try {
      const result = await handler(request, context);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
}

export function searchParamsObject(request: Request) {
  return Object.fromEntries(new URL(request.url).searchParams.entries());
}
