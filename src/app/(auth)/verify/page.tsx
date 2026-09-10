import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Check your inbox | FORGE", description: "We sent you an email with a link to continue." };

export default function VerifyPage() {
  return (
    <div className="flex animate-fade-up flex-col items-start gap-6">
      <span className="grid size-14 place-items-center rounded-full bg-ember-500/15 text-ember-400">
        <MailCheck className="size-6" aria-hidden />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold text-bone-50">Check your inbox</h1>
        <p className="text-ink-300">
          If an account exists for that email, a link to reset your password is on its way. It expires in one hour. Don&apos;t see it? Check your spam folder.
        </p>
      </div>
      <Button asChild variant="secondary">
        <Link href="/login">Back to log in</Link>
      </Button>
    </div>
  );
}
