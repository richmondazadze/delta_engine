"use client";

import { CheckCircle2 } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { cn } from "@/lib/utils";
import { PLATFORMS_WITH_ICONS, type PlatformDefinition } from "@/lib/platforms";

const CONNECT_BULLETS = [
  "Cross-platform account linking with encrypted credentials",
  "Unified copy rules, risk controls, and execution logs across connectors",
  "Symbol mapping when broker naming differs — configure once, operate everywhere",
] as const;

export function PlatformConnectSection() {
  const livePlatforms = PLATFORMS_WITH_ICONS.filter((p) => p.phase === "live");
  const plannedPlatforms = PLATFORMS_WITH_ICONS.filter((p) => p.phase === "planned");

  return (
    <MarketingReveal delay={0.08}>
      <div className="mx-auto max-w-5xl border-t border-border/80 pt-12 md:pt-16">
        <ul className="space-y-4">
          {CONNECT_BULLETS.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-base leading-relaxed text-muted-foreground md:text-lg"
            >
              <CheckCircle2
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-[var(--brand)]"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 grid gap-8 md:mt-12 md:grid-cols-2 md:gap-10">
          <PlatformStatusGroup
            kicker="Available today"
            platforms={livePlatforms}
            variant="live"
          />
          <PlatformStatusGroup
            kicker="On the roadmap"
            platforms={plannedPlatforms}
            variant="planned"
          />
        </div>
      </div>
    </MarketingReveal>
  );
}

function PlatformStatusGroup({
  kicker,
  platforms,
  variant,
}: {
  kicker: string;
  platforms: PlatformDefinition[];
  variant: "live" | "planned";
}) {
  return (
    <div>
      <p className="mk-kicker mb-4">{kicker}</p>
      <div className="flex flex-wrap gap-2.5">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="flex items-center gap-2.5 rounded-sm border bg-card px-3 py-2 shadow-xs"
          >
            <PlatformIcon
              platform={platform}
              size="sm"
              noBackground
              iconClassName="!h-8 !w-8 bg-transparent"
            />
            <span className="text-sm font-medium tracking-tight text-foreground">
              {platform.shortName}
            </span>
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em]",
                variant === "live"
                  ? "bg-[var(--brand)]/12 text-[var(--brand)]"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {variant === "live" ? "Live" : "Soon"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
