import { services } from "@/server/container";
import { NotFoundError } from "@/server/domain/errors";
import { apiHandler, readJson } from "@/server/http/api";
import { requireUser } from "@/server/http/session";
import { resolveResource } from "@/server/http/admin-resources";

type Ctx = { params: Promise<{ resource: string; id: string }> };

/** GET /api/admin/{resource}/{id} — Admin. */
export const GET = apiHandler<Ctx>(async (_request, { params }) => {
  await requireUser(["ADMIN"]);
  const { resource: name, id } = await params;
  const resource = resolveResource(name);
  if (!resource.get) throw new NotFoundError("Reading a single item is not supported for this resource");
  return { data: await resource.get(id) };
});

/** PUT /api/admin/{resource}/{id} — Admin. Update; audited. */
export const PUT = apiHandler<Ctx>(async (request, { params }) => {
  const admin = await requireUser(["ADMIN"]);
  const { resource: name, id } = await params;
  const resource = resolveResource(name);
  if (!resource.update) throw new NotFoundError("Updating is not supported for this resource");
  const data = await resource.update(id, await readJson(request), admin.id);
  await services().audit.record({ actorId: admin.id, action: "update", entity: resource.entity, entityId: id });
  return { data };
});

/** DELETE /api/admin/{resource}/{id} — Admin. Delete (or cancel, for bookings); audited. */
export const DELETE = apiHandler<Ctx>(async (_request, { params }) => {
  const admin = await requireUser(["ADMIN"]);
  const { resource: name, id } = await params;
  const resource = resolveResource(name);
  if (!resource.remove) throw new NotFoundError("Deleting is not supported for this resource");
  await resource.remove(id, admin.id);
  await services().audit.record({ actorId: admin.id, action: "delete", entity: resource.entity, entityId: id });
  return { ok: true };
});
