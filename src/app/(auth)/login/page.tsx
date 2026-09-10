import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "../auth-forms";
import { safeCallbackUrl } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Log in | FORGE", description: "Log in to your FORGE account to book classes and manage your membership." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; reset?: string }> }) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl) ?? undefined;
  return (
    <div className="flex animate-fade-up flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold text-bone-50">Welcome back</h1>
        <p className="text-ink-300">Log in to book classes and manage your membership.</p>
      </div>
      <LoginForm callbackUrl={callbackUrl} notice={params.reset ? "Your password was updated. Log in with your new password." : undefined} />
      <p className="text-center text-sm text-ink-300">
        New to FORGE?{" "}
        <Link href={`/signup${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-medium text-ember-300 hover:text-ember-100">
          Create an account
        </Link>
      </p>
    </div>
  );
}
