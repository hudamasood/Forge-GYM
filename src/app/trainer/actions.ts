"use server";

import { revalidatePath } from "next/cache";
import { services } from "@/server/container";
import { type ActionState, runAction } from "@/server/http/action";
import { requireUser } from "@/server/http/session";
import { attendanceSchema, parse } from "@/server/validation/schemas";

export async function markAttendanceAction(bookingId: string, status: "ATTENDED" | "NO_SHOW"): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser(["TRAINER", "ADMIN"]);
    const input = parse(attendanceSchema, { status });
    const trainer = await services().trainers.findByUserId(user.id);
    await services().bookings.markAttendance({ id: user.id, role: user.role, trainerId: trainer?.id ?? null }, bookingId, input.status);
    revalidatePath("/trainer/attendance", "layout");
    return status === "ATTENDED" ? "Marked attended" : "Marked no-show";
  });
}
