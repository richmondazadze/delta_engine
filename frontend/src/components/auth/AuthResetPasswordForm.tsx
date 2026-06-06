"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockIcon } from "lucide-react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { createClient } from "@/lib/supabase/client";

export function AuthResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthPageShell
      title="Choose a new password"
      description="Enter a new password for your CopyMorphic account."
    >
      <form className="space-y-3" onSubmit={submit}>
        <InputGroup className="h-11">
          <InputGroupInput
            aria-label="New password"
            autoComplete="new-password"
            minLength={8}
            placeholder="Minimum 8 characters"
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <LockIcon className="size-4" />
          </InputGroupAddon>
        </InputGroup>

        <InputGroup className="h-11">
          <InputGroupInput
            aria-label="Confirm password"
            autoComplete="new-password"
            minLength={8}
            placeholder="Confirm password"
            required
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <LockIcon className="size-4" />
          </InputGroupAddon>
        </InputGroup>

        {error ? (
          <p className="auth-alert border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button className="h-11 w-full text-base" disabled={loading} type="submit">
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>

      <p className="auth-switch-link text-base text-muted-foreground">
        <Link className="font-semibold text-[var(--brand)] hover:underline" href="/login">
          Back to sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}
