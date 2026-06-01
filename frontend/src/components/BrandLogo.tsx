import Image from "next/image";
import { APP_NAME } from "@/lib/brand";

type BrandLogoProps = {
  variant?: "full" | "mark";
  showName?: boolean;
  nameClassName?: string;
};

export function BrandLogo({
  variant = "mark",
  showName = true,
  nameClassName,
}: BrandLogoProps) {
  if (variant === "full") {
    return (
      <Image
        src="/logo.svg"
        alt={APP_NAME}
        width={160}
        height={32}
        priority
        style={{ height: 28, width: "auto" }}
      />
    );
  }

  return (
    <div className="row gap8" style={{ alignItems: "center" }}>
      <Image src="/logo-mark.svg" alt="" width={20} height={20} priority aria-hidden />
      {showName && (
        <span className={nameClassName} style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
          {APP_NAME}
        </span>
      )}
    </div>
  );
}
