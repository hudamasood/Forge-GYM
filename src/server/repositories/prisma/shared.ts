import { Prisma } from "@prisma/client";
import { ConflictError } from "@/server/domain/errors";
import type { Page } from "@/server/domain/types";
import type { PageRequest } from "@/server/repositories/interfaces";

/** Either the root client or a transaction client — repositories work with both. */
export type Db = Prisma.TransactionClient;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function pageArgs(request: PageRequest) {
  const page = Math.max(1, Math.floor(request.page ?? 1));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(request.pageSize ?? DEFAULT_PAGE_SIZE)));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function toPage<T>(items: T[], total: number, args: { page: number; pageSize: number }): Page<T> {
  return { items, total, page: args.page, pageSize: args.pageSize };
}

export function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** Runs a write and turns a unique-constraint violation into a ConflictError. */
export async function uniqueOrConflict<T>(write: () => Promise<T>, message: string): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (isUniqueViolation(error)) throw new ConflictError(message);
    throw error;
  }
}

/** Deletes, turning a foreign-key violation (the row is still referenced) into a ConflictError. */
export async function deleteOrConflict(remove: () => Promise<unknown>, message: string): Promise<void> {
  try {
    await remove();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2003" || error.code === "P2014")) {
      throw new ConflictError(message);
    }
    throw error;
  }
}

export function asStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function asStringRecord(value: Prisma.JsonValue | null | undefined): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

/** Drops undefined keys so partial updates never overwrite with undefined. */
export function defined<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) as Partial<T>;
}
