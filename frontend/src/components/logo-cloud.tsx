import { PlatformIcon } from "@/components/PlatformIcon";
import { PLATFORMS_WITH_ICONS } from "@/lib/platforms";

export function LogoCloud() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border bg-border sm:grid-cols-3">
      {PLATFORMS_WITH_ICONS.map((platform) => (
        <div
          key={platform.id}
          className="mk-platform-badge flex-col gap-4 bg-background py-8"
        >
          <PlatformIcon
            platform={platform}
            size="xl"
            iconClassName="bg-transparent"
          />
          <span className="text-center text-base font-semibold tracking-tight">
            {platform.shortName}
          </span>
        </div>
      ))}
    </div>
  );
}
