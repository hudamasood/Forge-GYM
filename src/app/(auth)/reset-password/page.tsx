import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "../auth-forms";

export const metadata: Metadata = { title: "Choose a new password | FORGE", description: "Set a new password for your FORGE account." };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="flex animate-fade-up flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold text-bone-50">New password</h1>
        <p className="text-ink-300">Choose a new password for your account.</p>
      </div>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="rounded-lg border border-warning-light/30 bg-warning/10 px-4 py-3 text-sm text-warning-light">
          This reset link is incomplete. <Link href="/forgot" className="underline">Request a new one</Link>.
        </p>
      )}
    </div>
  );
}
