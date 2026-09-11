import { services } from "@/server/container";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Panel } from "@/components/admin/admin-ui";
import { SpaceHoursForm } from "../access-objects/access-object-form";

export const dynamic = "force-dynamic";

export default async function AdminSpacesPage() {
  const objects = await services().accessObjects.list();
  return (
    <>
      <PortalHeader title="Spaces" description="The physical facilities behind each Access Object — opening hours shown on each Space page." />
      <div className="grid gap-5 lg:grid-cols-2">
        {objects.map((o) => (
          <Panel key={o.id} title={o.name}>
            <SpaceHoursForm accessObjectId={o.id} name={o.name} hours={o.space?.operatingHours ?? {}} />
            <p className="mt-4 text-xs text-ink-300">{o.space?.equipmentList.length ?? 0} equipment items · edit under Access Objects</p>
          </Panel>
        ))}
      </div>
    </>
  );
}
