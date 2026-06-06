"use client";

import { PlatformIcon } from "@/components/PlatformIcon";
import {
  MarketingStagger,
  MarketingStaggerItem,
} from "@/components/marketing/MarketingReveal";
import { cn } from "@/lib/utils";
import { PLATFORMS_WITH_ICONS } from "@/lib/platforms";

export function LogoCloud() {
  return (
    <MarketingStagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5">
      {PLATFORMS_WITH_ICONS.map((platform) => (
        <MarketingStaggerItem key={platform.id}>
          <div
            className="mk-platform-badge flex h-full min-h-[8.5rem] flex-col items-center justify-center gap-4 px-4 py-7 sm:px-6 sm:py-8"
            title={platform.name}
          >
            <PlatformIcon
              platform={platform}
              size="xl"
              iconClassName="bg-transparent"
            />
            <span
              className={cn(
                "rounded-sm px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em]",
                platform.phase === "live"
                  ? "bg-[var(--brand)]/12 text-[var(--brand)]"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {platform.phase === "live" ? "Live" : "Coming soon"}
            </span>
          </div>
        </MarketingStaggerItem>
      ))}
    </MarketingStagger>
  );
}
