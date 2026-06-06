import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  getPlatform,
  platformDisplayName,
  platformIconPath,
  type PlatformDefinition,
} from "@/lib/platforms";

type Size = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE: Record<
  Size,
  { box: string; imgWidth: number; imgHeight: number; wide?: boolean }
> = {
  xs: { box: "h-7 w-7", imgWidth: 28, imgHeight: 28 },
  sm: { box: "h-10 w-10", imgWidth: 40, imgHeight: 40 },
  md: { box: "h-12 w-12", imgWidth: 48, imgHeight: 48 },
  lg: { box: "h-16 w-16", imgWidth: 64, imgHeight: 64 },
  xl: { box: "h-[4.5rem] w-[8.5rem]", imgWidth: 136, imgHeight: 72, wide: true },
  "2xl": { box: "h-20 w-[9.5rem]", imgWidth: 152, imgHeight: 80, wide: true },
};

type Props = {
  platform: PlatformDefinition | string;
  size?: Size;
  showLabel?: boolean;
  label?: "name" | "short";
  noBackground?: boolean;
  className?: string;
  iconClassName?: string;
};

export function PlatformIcon({
  platform,
  size = "md",
  showLabel = false,
  label = "short",
  noBackground = false,
  className,
  iconClassName,
}: Props) {
  const def = typeof platform === "string" ? getPlatform(platform) : platform;
  if (!def?.icon) return null;

  const dims = SIZE[size];
  const text = label === "name" ? def.name : def.shortName;

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center",
          !noBackground && "overflow-hidden rounded-sm bg-background",
          dims.box,
          iconClassName,
        )}
      >
        <Image
          src={def.icon}
          alt={def.name}
          width={dims.imgWidth}
          height={dims.imgHeight}
          className={cn(
            "object-contain",
            dims.wide ? "h-[85%] w-[92%]" : noBackground ? "h-full w-full" : "h-[88%] w-[88%]",
          )}
        />
      </span>
      {showLabel ? (
        <span className="text-base font-semibold tracking-tight text-foreground">{text}</span>
      ) : null}
    </span>
  );
}

type BadgeProps = {
  platformId: string;
  size?: Size;
  className?: string;
};

/** Platform icon — no pill, no label, transparent background. */
export function PlatformBadge({
  platformId,
  size = "sm",
  className,
}: BadgeProps) {
  const icon = platformIconPath(platformId);

  if (!icon) {
    return (
      <span className={cn("badge badge-plain", className)}>
        {platformDisplayName(platformId)}
      </span>
    );
  }

  return (
    <PlatformIcon
      platform={platformId}
      size={size}
      noBackground
      className={className}
    />
  );
}
