import "server-only";
import { services } from "@/server/container";
import { isDomainError } from "@/server/domain/errors";

/** The signed-in user's trainer profile + upcoming sessions, or null when no profile is linked (e.g. an admin). */
export async function trainerContext(userId: string, days = 14) {
  try {
    return await services().trainers.scheduleForUser(userId, days);
  } catch (error) {
    if (isDomainError(error, "NOT_FOUND")) return null;
    throw error;
  }
}
