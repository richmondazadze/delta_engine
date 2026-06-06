import Image from "next/image";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

/** Full wordmark — use anywhere the old efferd block Logo SVG appeared. */
export function Logo({ className }: LogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt={APP_NAME}
      width={160}
      height={32}
      priority
      className={cn("h-7 w-auto", className)}
    />
  );
}

/** Icon mark only. */
export function LogoIcon({ className }: LogoProps) {
  return (
    <Image
      src="/logo-mark.svg"
      alt=""
      width={20}
      height={20}
      priority
      aria-hidden
      className={cn("size-5 shrink-0", className)}
    />
  );
}
