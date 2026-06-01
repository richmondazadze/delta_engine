"use client";

import Link from "next/link";
import { GoogleIcon } from "@/components/google-icon";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { AuthDivider } from "@/components/auth-divider";
import { FullWidthDivider } from "@/components/full-width-divider";
import { AtSignIcon } from "lucide-react";

/** @efferd/auth-4 layout — CopyMorphic branded preview (routes to /login & /register). */
export function AuthPage() {
  return (
    <div className="auth-page relative w-full overflow-hidden px-4 md:min-h-screen">
      <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center border-x *:px-6">
        <div className="flex flex-col space-y-6">
          <Link aria-label="CopyMorphic home" href="/">
            <Logo className="h-8" />
          </Link>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Hey, welcome!
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Log in or create your CopyMorphic workspace. It only takes a moment.
            </p>
          </div>
        </div>

        <div className="relative my-8 flex w-full flex-col gap-4 py-8">
          <FullWidthDivider position="top" />

          <Button
            className="h-11 w-full rounded-sm text-base"
            type="button"
            variant="outline"
            render={<Link href="/login" />}
            nativeButton={false}
          >
            <GoogleIcon data-icon="inline-start" className="size-4" />
            Continue with Google
          </Button>
          <AuthDivider>or continue with email</AuthDivider>
          <div className="space-y-3">
            <InputGroup className="h-11 rounded-sm">
              <InputGroupInput
                aria-label="Email address"
                placeholder="your.email@example.com"
                type="email"
              />
              <InputGroupAddon align="inline-start">
                <AtSignIcon className="size-4" />
              </InputGroupAddon>
            </InputGroup>

            <Button
              className="h-11 w-full rounded-sm text-base"
              render={<Link href="/login" />}
              nativeButton={false}
            >
              Continue with email
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-10 rounded-sm"
              variant="outline"
              render={<Link href="/login" />}
              nativeButton={false}
            >
              Sign in
            </Button>
            <Button
              className="h-10 rounded-sm"
              render={<Link href="/register" />}
              nativeButton={false}
            >
              Register
            </Button>
          </div>

          <FullWidthDivider position="bottom" />
        </div>

        <p className="pb-10 text-center text-sm leading-relaxed text-muted-foreground">
          By continuing, you agree to CopyMorphic&apos;s{" "}
          <a className="underline underline-offset-4 hover:text-primary" href="#">
            Terms of Service
          </a>{" "}
          and{" "}
          <a className="underline underline-offset-4 hover:text-primary" href="#">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
