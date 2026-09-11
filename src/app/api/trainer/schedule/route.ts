import { services } from "@/server/container";
import { apiHandler } from "@/server/http/api";
import { requireUser } from "@/server/http/session";

/** GET /api/trainer/schedule — Trainer. The signed-in trainer's sessions for the next 14 days. */
export const GET = apiHandler(async () => {
  const user = await requireUser(["TRAINER"]);
  const { trainer, sessions } = await services().trainers.scheduleForUser(user.id);
  return { trainer: { id: trainer.id, name: trainer.name, slug: trainer.slug }, sessions };
});
