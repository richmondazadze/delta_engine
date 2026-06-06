"use client";

import Link from "next/link";
import { useState } from "react";
import { AtSignIcon, MailIcon } from "lucide-react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { createClient } from "@/lib/supabase/client";

export function AuthForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage("Check your email for a password reset link.");
  };

  return (
    <AuthPageShell
      title="Reset password"
      description="Enter your email and we will send a link to choose a new password."
    >
      <form className="space-y-3" onSubmit={submit}>
        <InputGroup className="h-11">
          <InputGroupInput
            aria-label="Email address"
            autoComplete="email"
            placeholder="you@example.com"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <MailIcon className="size-4" />
          </InputGroupAddon>
        </InputGroup>

        {error ? (
          <p className="auth-alert border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="auth-alert border border-[var(--brand)]/30 bg-[var(--brand-tint)] px-3 py-2 text-sm text-[var(--brand-press)]">
            {message}
          </p>
        ) : null}

        <Button className="h-11 w-full text-base" disabled={loading} type="submit">
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="auth-switch-link text-base text-muted-foreground">
        Remember your password?{" "}
        <Link className="font-semibold text-[var(--brand)] hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}
