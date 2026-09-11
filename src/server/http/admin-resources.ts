import "server-only";
import { z } from "zod";
import { services } from "@/server/container";
import { NotFoundError, ValidationError } from "@/server/domain/errors";
import {
  accessObjectInputSchema,
  adminUserSchema,
  bookingStatusSchema,
  classInputSchema,
  membershipStatusSchema,
  orderStatusSchema,
  pageQuerySchema,
  parse,
  productInputSchema,
  scheduleInputSchema,
  trainerInputSchema,
} from "@/server/validation/schemas";

type Query = Record<string, string>;

interface AdminResource {
  list?: (query: Query) => Promise<unknown>;
  get?: (id: string) => Promise<unknown>;
  create?: (body: unknown, actorId: string) => Promise<unknown>;
  update?: (id: string, body: unknown, actorId: string) => Promise<unknown>;
  remove?: (id: string, actorId: string) => Promise<unknown>;
  entity: string;
}

const statusQuery = <T extends z.ZodType>(schema: T) => z.object({ status: schema.optional().catch(undefined) });

/**
 * /api/admin/{resource} registry (spec B3). Each resource maps REST verbs to
 * one service method with a zod-validated body; the route handler stays thin.
 */
export const ADMIN_RESOURCES: Record<string, AdminResource> = {
  members: {
    entity: "User",
    list: (q) => services().users.list({ ...parse(pageQuerySchema, q), role: q.role === "MEMBER" || q.role === "TRAINER" || q.role === "ADMIN" ? q.role : undefined }),
    get: (id) => services().users.getById(id),
    update: (id, body, actorId) => services().users.adminUpdate(actorId, id, parse(adminUserSchema, body)),
    remove: (id, actorId) => services().users.adminDelete(actorId, id),
  },
  memberships: {
    entity: "Membership",
    list: (q) => services().memberships.listAll({ ...parse(pageQuerySchema, q), ...parse(statusQuery(membershipStatusSchema.shape.status), q) }),
    update: (id, body) => services().memberships.adminSetStatus(id, parse(membershipStatusSchema, body).status),
  },
  "access-objects": {
    entity: "AccessObject",
    list: () => services().accessObjects.list(),
    update: async (id, body) => {
      const { equipmentList, ...input } = parse(accessObjectInputSchema, { ...(body as object), equipmentList: ((body as { equipmentList?: string[] }).equipmentList ?? []).join("\n") });
      const updated = await services().accessObjects.update(id, input);
      await services().accessObjects.updateSpace(id, { equipmentList });
      return updated;
    },
  },
  classes: {
    entity: "Class",
    list: () => services().classes.list(),
    create: (body) => services().classes.create(parse(classInputSchema, withLines(body, "benefits"))),
    update: (id, body) => services().classes.update(id, parse(classInputSchema, withLines(body, "benefits"))),
    remove: (id) => services().classes.delete(id),
  },
  trainers: {
    entity: "Trainer",
    list: () => services().trainers.list(),
    create: (body) => services().trainers.create(parse(trainerInputSchema, withLines(body, "certifications"))),
    update: (id, body) => services().trainers.update(id, parse(trainerInputSchema, withLines(body, "certifications"))),
    remove: (id) => services().trainers.delete(id),
  },
  schedules: {
    entity: "Schedule",
    list: (q) => services().schedules.listUpcoming({ from: q.from ? new Date(q.from) : undefined, to: q.to ? new Date(q.to) : undefined }),
    get: (id) => services().schedules.getDetail(id),
    create: (body) => services().schedules.create(parse(scheduleInputSchema, body)),
    update: (id, body) => services().schedules.update(id, parse(scheduleInputSchema, body)),
    remove: (id) => services().schedules.delete(id),
  },
  products: {
    entity: "Product",
    list: () => services().orders.listProducts(),
    create: (body) => services().orders.createProduct(parse(productInputSchema, withLines(body, "images"))),
    update: (id, body) => services().orders.updateProduct(id, parse(productInputSchema, withLines(body, "images"))),
    remove: (id) => services().orders.deleteProduct(id),
  },
  orders: {
    entity: "Order",
    list: (q) => services().orders.listAll({ ...parse(pageQuerySchema, q), ...parse(statusQuery(orderStatusSchema.shape.status), q) }),
    get: (id) => services().orders.getForViewer({ id: "", role: "ADMIN" }, id),
    update: (id, body) => services().orders.setStatus(id, parse(orderStatusSchema, body).status),
  },
  bookings: {
    entity: "Booking",
    list: (q) => services().bookings.listAll({ ...parse(pageQuerySchema, q), ...parse(statusQuery(bookingStatusSchema.shape.status), q) }),
    remove: (id, actorId) => services().bookings.cancelBooking({ id: actorId, role: "ADMIN" }, id),
  },
};

/** JSON clients send arrays; the shared schemas accept newline-separated text (form input). */
function withLines(body: unknown, key: string) {
  if (!body || typeof body !== "object") throw new ValidationError("Request body must be an object");
  const value = (body as Record<string, unknown>)[key];
  return { ...body, [key]: Array.isArray(value) ? value.join("\n") : (value ?? "") };
}

export function resolveResource(name: string): AdminResource {
  const resource = ADMIN_RESOURCES[name];
  if (!resource) throw new NotFoundError(`Unknown admin resource "${name}"`);
  return resource;
}
