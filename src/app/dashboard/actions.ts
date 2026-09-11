"use server";

import { revalidatePath } from "next/cache";
import { services } from "@/server/container";
import { type ActionState, runAction } from "@/server/http/action";
import { requireUser } from "@/server/http/session";
import { changePasswordSchema, formToObject, parse, profileSchema } from "@/server/validation/schemas";

export async function cancelBookingAction(bookingId: string): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser();
    await services().bookings.cancelBooking({ id: user.id, role: user.role }, bookingId);
    revalidatePath("/dashboard", "layout");
    return "Booking cancelled — your seat has been released.";
  });
}

export async function cancelMembershipAction(membershipId: string): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser();
    await services().memberships.cancel({ id: user.id, role: user.role }, membershipId);
    revalidatePath("/dashboard", "layout");
    return "Cancellation confirmed. You keep access until the end of your paid period.";
  });
}

export async function updateProfileAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser();
    const input = parse(profileSchema, formToObject(form));
    await services().users.updateProfile(user.id, input);
    revalidatePath("/dashboard/profile");
    return "Profile saved.";
  });
}

export async function changePasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser();
    const { currentPassword, newPassword } = parse(changePasswordSchema, formToObject(form));
    await services().users.changePassword(user.id, currentPassword, newPassword);
    return "Password updated.";
  });
}
