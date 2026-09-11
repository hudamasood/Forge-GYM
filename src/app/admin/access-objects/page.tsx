import Link from "next/link";
import { services } from "@/server/container";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Panel } from "@/components/admin/admin-ui";
import { ObjectIcon } from "@/components/brand/art";
import { AccessObjectForm } from "./access-object-form";

export const dynamic = "force-dynamic";

export default async function AdminAccessObjectsPage() {
  const objects = await services().accessObjects.list();
  return (
    <>
      <PortalHeader title="Access Objects" description="The six commercial spaces. Each has its own plan; All-Access covers them all. Physical details (hours) live under Spaces." />
      <div className="flex flex-col gap-6">
        {objects.map((o) => (
          <Panel
            key={o.id}
            title={o.name}
            actions={
              <span className="flex items-center gap-3 text-sm">
                <ObjectIcon slug={o.slug} className="size-4 text-ember-400" />
                <Link href={`/spaces/${o.slug}`} className="text-ember-300 hover:text-ember-100">
                  /spaces/{o.slug}
                </Link>
              </span>
            }
          >
            <AccessObjectForm obj={{ id: o.id, name: o.name, tagline: o.tagline, description: o.description, equipmentList: o.space?.equipmentList ?? [] }} />
          </Panel>
        ))}
      </div>
    </>
  );
}
