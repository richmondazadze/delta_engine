"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function LoginFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const callbackError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
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
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <AuthPageShell
      title="Welcome back"
      description="Sign in to your CopyMorphic workspace — manage copiers, accounts, and execution logs from one command center."
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
            autoComplete="current-password"
            placeholder="Password"
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <LockIcon className="size-4" />
          </InputGroupAddon>
        </InputGroup>

        <div className="auth-forgot-link flex justify-end lg:justify-end">
          <Link
            className="text-sm font-medium text-[var(--brand)] hover:underline"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>

        {callbackError === "auth_callback" && !error ? (
          <p className="auth-alert border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Sign-in could not be completed. Try email/password or check OAuth redirect URLs in
            Supabase.
          </p>
        ) : null}
        {error ? (
          <p className="auth-alert border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          className="h-11 w-full text-base"
          disabled={loading || googleLoading}
          type="submit"
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="auth-switch-link text-base text-muted-foreground">
        No account?{" "}
        <Link className="font-semibold text-[var(--brand)] hover:underline" href="/register">
          Create one
        </Link>
      </p>
    </AuthPageShell>
  );
}

export function AuthLoginForm() {
  return (
    <Suspense>
      <LoginFormInner />
    </Suspense>
  );
}
