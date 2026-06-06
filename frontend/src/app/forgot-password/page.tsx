"use client";

import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      description="Enter your email and we will send a reset link."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          className="h-10 rounded-sm border border-input bg-background px-3 text-sm"
          placeholder="you@example.com"
          required
        />
        <button type="submit" className="btn btn-primary w-full" disabled>
          Send reset link (configure Supabase email)
        </button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
