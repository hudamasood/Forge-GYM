import Link from "next/link";
import { services } from "@/server/container";
import { requirePageUser } from "@/server/http/session";
import { PortalHeader } from "@/components/layout/portal-shell";
import { Badge } from "@/components/ui/badge";
import { PasswordForm, ProfileForm } from "@/app/dashboard/profile/profile-forms";

export const dynamic = "force-dynamic";

export default async function TrainerProfilePage() {
  const session = await requirePageUser();
  const [user, trainer] = await Promise.all([services().users.getById(session.id), services().trainers.findByUserId(session.id)]);

  return (
    <>
      <PortalHeader title="Profile" description="Your account details. Your public coach bio is edited by the admin team." />
      {trainer && (
        <section aria-labelledby="public-heading" className="mb-6 rounded-2xl border border-bone-50/8 bg-ink-800/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="public-heading" className="font-display text-2xl text-bone-50">
              Public profile
            </h2>
            <Link href={`/trainers/${trainer.slug}`} className="text-sm text-ember-300 hover:text-ember-100">
              View on site
            </Link>
          </div>
          <p className="mt-3 text-ink-300">{trainer.bio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="ember">{trainer.specialty}</Badge>
            {trainer.certifications.map((c) => (
              <Badge key={c}>{c}</Badge>
            ))}
          </div>
        </section>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="details-heading" className="rounded-2xl border border-bone-50/8 bg-ink-800/60 p-6 sm:p-8">
          <h2 id="details-heading" className="mb-6 font-display text-2xl text-bone-50">
            Account
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
