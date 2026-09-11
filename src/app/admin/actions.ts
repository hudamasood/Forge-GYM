"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { services } from "@/server/container";
import { type ActionState, runAction } from "@/server/http/action";
import { requireUser } from "@/server/http/session";
import {
  accessObjectInputSchema,
  adminUserSchema,
  classInputSchema,
  formToObject,
  membershipStatusSchema,
  orderStatusSchema,
  parse,
  planPriceSchema,
  productInputSchema,
  scheduleInputSchema,
  trainerInputSchema,
} from "@/server/validation/schemas";
import { z } from "zod";

/** Every admin mutation: role re-checked server-side, input validated, change audited (spec B5). */
async function adminMutation(entity: string, action: string, entityId: string | null, work: (actorId: string) => Promise<unknown>, paths: string[]) {
  const admin = await requireUser(["ADMIN"]);
  const result = await work(admin.id);
  const id = entityId ?? (result as { id?: string } | undefined)?.id ?? null;
  await services().audit.record({ actorId: admin.id, action, entity, entityId: id });
  for (const path of [...paths, "/admin"]) revalidatePath(path);
  return result;
}

/**
 * Public pages that display catalog data are ISR-cached; refresh them after
 * admin edits. Targeted per route (not the root layout), so the admin portal's
 * own client router state is left alone.
 */
const PUBLIC_PAGES = ["/", "/classes", "/trainers", "/memberships", "/spaces", "/store", "/sitemap.xml"];
const PUBLIC_DETAIL_ROUTES = ["/classes/[slug]", "/trainers/[slug]", "/spaces/[slug]", "/store/[slug]"];

function revalidateSite() {
  for (const path of PUBLIC_PAGES) revalidatePath(path);
  for (const route of PUBLIC_DETAIL_ROUTES) revalidatePath(route, "page");
}

// ---------------------------------------------------------------- Members

export async function updateMemberAction(userId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const input = parse(adminUserSchema, formToObject(form));
    await adminMutation("User", "update", userId, (actorId) => services().users.adminUpdate(actorId, userId, input), ["/admin/members"]);
    return "Member updated.";
  });
}

export async function deleteMemberAction(userId: string): Promise<ActionState> {
  return runAction(async () => {
    await adminMutation("User", "delete", userId, (actorId) => services().users.adminDelete(actorId, userId), ["/admin/members"]);
    return "Member deleted.";
  });
}

// ---------------------------------------------------------------- Memberships & plans

export async function setMembershipStatusAction(membershipId: string, status: string): Promise<ActionState> {
  return runAction(async () => {
    const input = parse(membershipStatusSchema, { status });
    await adminMutation("Membership", `status:${input.status}`, membershipId, () => services().memberships.adminSetStatus(membershipId, input.status), ["/admin/memberships"]);
    return "Membership updated.";
  });
}

export async function updatePlanPricingAction(planId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const raw = formToObject(form);
    const input = parse(planPriceSchema, {
      ...raw,
      priceMonthly: Math.round(Number(raw.priceMonthly) * 100),
      priceAnnual: Math.round(Number(raw.priceAnnual) * 100),
    });
    await adminMutation("MembershipPlan", "update-pricing", planId, () => services().memberships.updatePlan(planId, input), ["/admin/memberships"]);
    revalidateSite();
    return "Plan pricing saved.";
  });
}

// ---------------------------------------------------------------- Access Objects & Spaces

export async function updateAccessObjectAction(accessObjectId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const { equipmentList, ...input } = parse(accessObjectInputSchema, formToObject(form));
    await adminMutation(
      "AccessObject",
      "update",
      accessObjectId,
      async () => {
        await services().accessObjects.update(accessObjectId, input);
        await services().accessObjects.updateSpace(accessObjectId, { equipmentList });
      },
      ["/admin/access-objects"],
    );
    revalidateSite();
    return "Space saved.";
  });
}

const hoursSchema = z.object({ weekdays: z.string().trim().min(3).max(40), weekends: z.string().trim().min(3).max(40) });

export async function updateSpaceHoursAction(accessObjectId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const hours = parse(hoursSchema, formToObject(form));
    await adminMutation("Space", "update-hours", accessObjectId, () => services().accessObjects.updateSpace(accessObjectId, { operatingHours: hours }), ["/admin/spaces"]);
    revalidateSite();
    return "Hours saved.";
  });
}

// ---------------------------------------------------------------- Classes

export async function saveClassAction(classId: string | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  const state = await runAction(async () => {
    const input = parse(classInputSchema, formToObject(form));
    await adminMutation("Class", classId ? "update" : "create", classId, () => (classId ? services().classes.update(classId, input) : services().classes.create(input)), ["/admin/classes"]);
    revalidateSite();
  });
  if (!state.ok) return state;
  redirect("/admin/classes?saved=1");
}

export async function deleteClassAction(classId: string): Promise<ActionState> {
  return runAction(async () => {
    await adminMutation("Class", "delete", classId, () => services().classes.delete(classId), ["/admin/classes"]);
    revalidateSite();
    return "Class deleted.";
  });
}

// ---------------------------------------------------------------- Trainers

export async function saveTrainerAction(trainerId: string | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  const state = await runAction(async () => {
    const input = parse(trainerInputSchema, formToObject(form));
    await adminMutation("Trainer", trainerId ? "update" : "create", trainerId, () => (trainerId ? services().trainers.update(trainerId, input) : services().trainers.create(input)), [
      "/admin/trainers",
    ]);
    revalidateSite();
  });
  if (!state.ok) return state;
  redirect("/admin/trainers?saved=1");
}

export async function deleteTrainerAction(trainerId: string): Promise<ActionState> {
  return runAction(async () => {
    await adminMutation("Trainer", "delete", trainerId, () => services().trainers.delete(trainerId), ["/admin/trainers"]);
    revalidateSite();
    return "Trainer deleted.";
  });
}

// ---------------------------------------------------------------- Schedule

export async function createScheduleAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const input = parse(scheduleInputSchema, formToObject(form));
    await adminMutation("Schedule", "create", null, () => services().schedules.create(input), ["/admin/schedule"]);
    revalidateSite();
    return "Session added to the timetable.";
  });
}

export async function deleteScheduleAction(scheduleId: string): Promise<ActionState> {
  return runAction(async () => {
    await adminMutation("Schedule", "delete", scheduleId, () => services().schedules.delete(scheduleId), ["/admin/schedule"]);
    revalidateSite();
    return "Session removed.";
  });
}

// ---------------------------------------------------------------- Bookings

export async function adminCancelBookingAction(bookingId: string): Promise<ActionState> {
  return runAction(async () => {
    await adminMutation("Booking", "cancel", bookingId, async (actorId) => services().bookings.cancelBooking({ id: actorId, role: "ADMIN" }, bookingId), ["/admin/bookings"]);
    return "Booking cancelled.";
  });
}

// ---------------------------------------------------------------- Products & orders

export async function saveProductAction(productId: string | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  const state = await runAction(async () => {
    const raw = formToObject(form);
    const input = parse(productInputSchema, { ...raw, price: Math.round(Number(raw.price) * 100) });
    await adminMutation("Product", productId ? "update" : "create", productId, () => (productId ? services().orders.updateProduct(productId, input) : services().orders.createProduct(input)), [
      "/admin/products",
    ]);
    revalidateSite();
  });
  if (!state.ok) return state;
  redirect("/admin/products?saved=1");
}

export async function deleteProductAction(productId: string): Promise<ActionState> {
  return runAction(async () => {
    await adminMutation("Product", "delete", productId, () => services().orders.deleteProduct(productId), ["/admin/products"]);
    revalidateSite();
    return "Product deleted.";
  });
}

export async function setOrderStatusAction(orderId: string, status: string): Promise<ActionState> {
  return runAction(async () => {
    const input = parse(orderStatusSchema, { status });
    await adminMutation("Order", `status:${input.status}`, orderId, () => services().orders.setStatus(orderId, input.status), ["/admin/orders"]);
    return `Order marked ${input.status.toLowerCase()}.`;
  });
}
