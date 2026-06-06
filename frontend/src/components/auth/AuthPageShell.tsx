import "@/app/auth-brand.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { FloatingPaths } from "@/components/floating-paths";
import { Button } from "@/components/ui/button";

type AuthPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthPageShell({ title, description, children, footer }: AuthPageShellProps) {
  return (
    <main className="auth-page relative min-h-[100dvh] lg:grid lg:min-h-screen lg:grid-cols-2 lg:overflow-hidden">
      <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
        <Link aria-label="CopyMorphic home" href="/">
          <Logo className="relative z-10 mr-auto h-7" />
        </Link>
        <div className="relative z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">
              &ldquo;CopyMorphic keeps my master and follower accounts in sync — I spend less time
              babysitting terminals and more time trading.&rdquo;
            </p>
            <footer className="font-mono text-sm font-semibold">~ CopyMorphic trader</footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div className="auth-page-panel relative flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,env(safe-area-inset-top))] sm:px-6 sm:pb-10 sm:pt-24 lg:min-h-screen lg:items-stretch lg:px-8 lg:pb-12 lg:pt-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 isolate -z-10 overflow-hidden opacity-60"
        >
          <div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
        </div>

        <Button
          className="auth-home-btn absolute top-[max(1rem,env(safe-area-inset-top))] left-4 sm:left-5 lg:top-7"
          variant="ghost"
          render={<Link href="/" />}
          nativeButton={false}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Home
        </Button>

        <div className="auth-page-inner mx-auto flex w-full max-w-sm flex-col items-center space-y-6 text-center lg:items-start lg:text-left">
          <Logo className="mx-auto h-7 lg:hidden" />

          <div className="auth-page-copy w-full space-y-2">
            <h1 className="text-[clamp(1.5rem,5vw,1.75rem)] font-bold tracking-wide">{title}</h1>
            <p className="mx-auto max-w-[34ch] text-base leading-relaxed text-muted-foreground lg:mx-0 lg:max-w-none">
              {description}
            </p>
          </div>

          <div className="auth-page-form w-full space-y-4 text-left">{children}</div>

          {footer ?? (
            <p className="auth-page-legal mx-auto max-w-[36ch] text-sm leading-relaxed text-muted-foreground lg:mx-0 lg:max-w-none">
              By continuing, you agree to our{" "}
              <Link
                className="underline underline-offset-4 hover:text-primary"
                href="/terms"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                className="underline underline-offset-4 hover:text-primary"
                href="/privacy"
              >
                Privacy Policy
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
