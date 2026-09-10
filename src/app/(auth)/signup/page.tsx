import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "../auth-forms";
import { safeCallbackUrl } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Create account | FORGE", description: "Create your FORGE account to choose a membership and start booking classes." };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl) ?? undefined;
  return (
    <div className="flex animate-fade-up flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold text-bone-50">Join FORGE</h1>
        <p className="text-ink-300">Create your account, then pick the space you train in — or go All-Access.</p>
      </div>
      <SignupForm callbackUrl={callbackUrl} />
      <p className="text-center text-sm text-ink-300">
        Already a member?{" "}
        <Link href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-medium text-ember-300 hover:text-ember-100">
          Log in
        </Link>
      </p>
    </div>
  );
}
