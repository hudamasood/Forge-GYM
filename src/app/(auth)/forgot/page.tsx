import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "../auth-forms";

export const metadata: Metadata = { title: "Reset password | FORGE", description: "Request a link to reset your FORGE account password." };

export default function ForgotPasswordPage() {
  return (
    <div className="flex animate-fade-up flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold text-bone-50">Forgot password</h1>
        <p className="text-ink-300">Enter the email on your account and we&apos;ll send you a link to choose a new password.</p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-ink-300">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-ember-300 hover:text-ember-100">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
