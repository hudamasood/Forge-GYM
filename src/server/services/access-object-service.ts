import { NotFoundError } from "@/server/domain/errors";
import type { Space } from "@/server/domain/types";
import type { AccessObjectInput, IAccessObjectRepository } from "@/server/repositories/interfaces";

export class AccessObjectService {
  constructor(private readonly accessObjects: IAccessObjectRepository) {}

  list() {
    return this.accessObjects.list();
  }

  async getBySlug(slug: string) {
    const obj = await this.accessObjects.findBySlug(slug);
    if (!obj) throw new NotFoundError("Space not found");
    return obj;
  }

  update(id: string, input: Partial<AccessObjectInput>) {
    return this.accessObjects.update(id, input);
  }

  updateSpace(accessObjectId: string, input: Partial<Pick<Space, "equipmentList" | "operatingHours" | "galleryImages">>) {
    return this.accessObjects.updateSpace(accessObjectId, input);
  }
}
