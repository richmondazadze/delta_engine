import type { PlatformType } from "@/lib/types";

export type PlatformCapability = {
  platform: string;
  display_name: string;
  link_account: boolean;
  copy_as_master: boolean;
  copy_as_follower: boolean;
  requires_terminal_path: boolean;
  requires_api_base_url: boolean;
};

let cached: PlatformCapability[] | null = null;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchPlatformCapabilities(): Promise<PlatformCapability[]> {
  if (cached) return cached;
  const res = await fetch(`${API_URL}/api/integrations/platform-capabilities`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load platform capabilities");
  const data = (await res.json()) as { platforms: PlatformCapability[] };
  cached = data.platforms;
  return cached;
}

/** Client-side fallback when API is offline. */
export const DEFAULT_PLATFORM_CAPABILITIES: PlatformCapability[] = [
  {
    platform: "mt5",
    display_name: "MetaTrader 5",
    link_account: true,
    copy_as_master: true,
    copy_as_follower: true,
    requires_terminal_path: true,
    requires_api_base_url: false,
  },
  {
    platform: "dxtrade",
    display_name: "DXtrade",
    link_account: true,
    copy_as_master: true,
    copy_as_follower: true,
    requires_terminal_path: false,
    requires_api_base_url: true,
  },
];

export function getCapability(
  caps: PlatformCapability[],
  platform: string,
): PlatformCapability | undefined {
  return caps.find((c) => c.platform === platform);
}

export function accountOptionLabel(
  label: string | null | undefined,
  accountNumber: string,
  platform: PlatformType | string,
): string {
  const name = label?.trim() || accountNumber;
  const plat = String(platform).toUpperCase();
  return `${name} · ${plat}`;
}

export function crossPlatformCopyHint(
  masterPlatform: string | undefined,
  followerPlatform: string | undefined,
): string | null {
  if (!masterPlatform || !followerPlatform || masterPlatform === followerPlatform) {
    return null;
  }
  return (
    "Cross-platform copy — add symbol mappings if names differ (e.g. EURUSDm → EURUSD) " +
    "and consider Max Signal Age 15000 ms or higher."
  );
}
