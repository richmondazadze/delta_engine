import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { FullWidthDivider } from "@/components/full-width-divider";
import { ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="relative w-full overflow-hidden px-4 md:min-h-screen">
      <Button
        className="absolute top-6 left-4 z-10 h-10 rounded-sm px-3 text-base md:left-6"
        variant="ghost"
        render={<Link href="/" />}
        nativeButton={false}
      >
        <ChevronLeftIcon data-icon="inline-start" />
        Home
      </Button>

      <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center border-x *:px-6">
        <div className="flex flex-col space-y-6 pt-14">
          <Link aria-label="CopyMorphic home" href="/">
            <Logo className="h-8" />
          </Link>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
            <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="relative my-8 flex w-full flex-col gap-4 py-8">
          <FullWidthDivider position="top" />
          {children}
          <FullWidthDivider position="bottom" />
        </div>

        {footer ?? (
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
        )}
      </div>
    </div>
  );
}
