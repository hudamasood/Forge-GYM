import { NextResponse } from "next/server";
import { services } from "@/server/container";
import { NotFoundError } from "@/server/domain/errors";
import { apiHandler, readJson, searchParamsObject } from "@/server/http/api";
import { requireUser } from "@/server/http/session";
import { resolveResource } from "@/server/http/admin-resources";

type Ctx = { params: Promise<{ resource: string }> };

/** GET /api/admin/{resource} — Admin. List (paginated where applicable). */
export const GET = apiHandler<Ctx>(async (request, { params }) => {
  await requireUser(["ADMIN"]);
  const resource = resolveResource((await params).resource);
  if (!resource.list) throw new NotFoundError("Listing is not supported for this resource");
  return { data: await resource.list(searchParamsObject(request)) };
});

/** POST /api/admin/{resource} — Admin. Create; audited. */
export const POST = apiHandler<Ctx>(async (request, { params }) => {
  const admin = await requireUser(["ADMIN"]);
  const resource = resolveResource((await params).resource);
  if (!resource.create) throw new NotFoundError("Creating is not supported for this resource");
  const created = (await resource.create(await readJson(request), admin.id)) as { id?: string };
  await services().audit.record({ actorId: admin.id, action: "create", entity: resource.entity, entityId: created?.id ?? null });
  return NextResponse.json({ data: created }, { status: 201 });
});
