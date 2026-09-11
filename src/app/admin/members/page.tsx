import { Users } from "lucide-react";
import { services } from "@/server/container";
import { requirePageUser } from "@/server/http/session";
import { pageQuerySchema } from "@/server/validation/schemas";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Pagination, SearchBar } from "@/components/admin/admin-ui";
import { FilterChips } from "@/components/layout/filter-chips";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { formatDate, titleCase } from "@/lib/format";
import { ROLES, type Role } from "@/server/domain/types";
import { MemberRowActions } from "./member-row-actions";

export const dynamic = "force-dynamic";

export default async function MembersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const admin = await requirePageUser(["ADMIN"]);
  const params = await searchParams;
  const query = pageQuerySchema.parse(params);
  const role = ROLES.includes(params.role as Role) ? (params.role as Role) : undefined;
  const result = await services().users.list({ ...query, role, pageSize: 20 });

  return (
    <>
      <PortalHeader title="Members" description="Every account on the platform. Change roles, edit details or remove accounts." />
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          label="Filter by role"
          param="role"
          basePath="/admin/members"
          current={role}
          otherParams={{ search: query.search }}
          options={[{ label: "Everyone", value: undefined }, ...ROLES.map((r) => ({ label: titleCase(r), value: r }))]}
        />
        <SearchBar action="/admin/members" defaultValue={query.search} placeholder="Search name or email" hidden={{ role }} />
      </div>
      {result.items.length === 0 ? (
        <EmptyState icon={Users} title="No accounts found" message="Try a different search or role." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Role</TH>
              <TH>Joined</TH>
              <TH className="text-right">
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {result.items.map((u) => (
              <TR key={u.id}>
                <TD className="font-medium text-bone-50">{u.name}</TD>
                <TD>{u.email}</TD>
                <TD>
                  <Badge tone={u.role === "ADMIN" ? "ember" : u.role === "TRAINER" ? "steel" : "neutral"}>{titleCase(u.role)}</Badge>
                </TD>
                <TD>{formatDate(u.createdAt)}</TD>
                <TD>
                  <MemberRowActions user={{ id: u.id, name: u.name, phone: u.phone, role: u.role, email: u.email }} isSelf={u.id === admin.id} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} basePath="/admin/members" params={{ search: query.search, role }} />
    </>
  );
}
