"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSignIcon, LockIcon, MailIcon } from "lucide-react";
import { GoogleIcon } from "@/components/google-icon";
import { AuthDivider } from "@/components/auth-divider";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { createClient } from "@/lib/supabase/client";

export function AuthRegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
      },
    });
    if (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
      },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setMessage("Check your email to confirm your account, then sign in.");
    setLoading(false);
  };

  return (
    <AuthPageShell
      title="Create your workspace"
      description="Start free with CopyMorphic — connect accounts, deploy copy paths, and monitor execution across every platform you trade on."
    >
      <Button
        className="h-11 w-full text-base"
        type="button"
        variant="outline"
        disabled={googleLoading || loading}
        onClick={signInWithGoogle}
      >
        <GoogleIcon data-icon="inline-start" className="size-4" />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </Button>

      <AuthDivider>or continue with email</AuthDivider>

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

        <InputGroup className="h-11">
          <InputGroupInput
            aria-label="Password"
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

        <Button
          className="h-11 w-full text-base"
          disabled={loading || googleLoading}
          type="submit"
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="auth-switch-link text-base text-muted-foreground">
        Already have an account?{" "}
        <Link className="font-semibold text-[var(--brand)] hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}
