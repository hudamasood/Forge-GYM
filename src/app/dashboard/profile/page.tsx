import { services } from "@/server/container";
import { requirePageUser } from "@/server/http/session";
import { PortalHeader } from "@/components/layout/portal-shell";
import { PasswordForm, ProfileForm } from "./profile-forms";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requirePageUser();
  const user = await services().users.getById(session.id);
  return (
    <>
      <PortalHeader title="Profile" description="Your details and password." />
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="details-heading" className="rounded-2xl border border-bone-50/8 bg-ink-800/60 p-6 sm:p-8">
          <h2 id="details-heading" className="mb-6 font-display text-2xl text-bone-50">
            Details
          </h2>
          <ProfileForm name={user.name} phone={user.phone} email={user.email} />
        </section>
        <section aria-labelledby="password-heading" className="rounded-2xl border border-bone-50/8 bg-ink-800/60 p-6 sm:p-8">
          <h2 id="password-heading" className="mb-6 font-display text-2xl text-bone-50">
            Password
          </h2>
          <PasswordForm />
        </section>
      </div>
    </>
  );
}
