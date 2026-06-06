import type { PlatformType } from "@/lib/types";

/** Icon paths under /public/platform_icons — only entries with a real asset file. */
export type PlatformDefinition = {
  id: PlatformType | "tradovate" | "projectx" | "rithmic";
  name: string;
  shortName: string;
  icon: string;
  /** Included in PRD (initial or future roadmap). */
  inPrd: boolean;
  /** MVP / live today vs planned connector. */
  phase: "live" | "planned";
};

export const PLATFORM_CATALOG: PlatformDefinition[] = [
  {
    id: "mt5",
    name: "MetaTrader 5",
    shortName: "MT5",
    icon: "/platform_icons/mt5-logo.png",
    inPrd: true,
    phase: "live",
  },
  {
    id: "mt4",
    name: "MetaTrader 4",
    shortName: "MT4",
    icon: "/platform_icons/metatrada-4.webp",
    inPrd: true,
    phase: "planned",
  },
  {
    id: "ctrader",
    name: "cTrader",
    shortName: "cTrader",
    icon: "/platform_icons/c-trader.webp",
    inPrd: true,
    phase: "planned",
  },
  {
    id: "dxtrade",
    name: "DXtrade",
    shortName: "DXtrade",
    icon: "/platform_icons/dxtrade.webp",
    inPrd: true,
    phase: "live",
  },
  {
    id: "tradelocker",
    name: "TradeLocker",
    shortName: "TradeLocker",
    icon: "/platform_icons/tradelocker.webp",
    inPrd: true,
    phase: "planned",
  },
  {
    id: "ninjatrader",
    name: "NinjaTrader",
    shortName: "NinjaTrader",
    icon: "/platform_icons/ninaatrader.webp",
    inPrd: true,
    phase: "planned",
  },
  {
    id: "tradovate",
    name: "Tradovate",
    shortName: "Tradovate",
    icon: "/platform_icons/tradovate.webp",
    inPrd: false,
    phase: "planned",
  },
  {
    id: "projectx",
    name: "ProjectX",
    shortName: "ProjectX",
    icon: "/platform_icons/projectx-icon.webp",
    inPrd: false,
    phase: "planned",
  },
  {
    id: "rithmic",
    name: "Rithmic",
    shortName: "Rithmic",
    icon: "/platform_icons/rithmic-wordmark.webp",
    inPrd: false,
    phase: "planned",
  },
];

/** All platforms with icon assets (for marketing grids). */
export const PLATFORMS_WITH_ICONS = PLATFORM_CATALOG;

/** PRD platforms that have icons — homepage marquee only. */
export const PRD_MARQUEE_PLATFORMS = PLATFORM_CATALOG.filter((p) => p.inPrd);

/** Full marketed list including platforms without icons (e.g. Match Trader). */
export const PLATFORM_NAMES = [
  ...PLATFORM_CATALOG.map((p) => p.name),
  "Match Trader",
] as const;

const byId = new Map(PLATFORM_CATALOG.map((p) => [p.id, p]));

export function getPlatform(id: string): PlatformDefinition | undefined {
  return byId.get(id as PlatformDefinition["id"]);
}

export function platformDisplayName(id: string): string {
  return getPlatform(id)?.name ?? id.toUpperCase();
}

export function platformShortName(id: string): string {
  return getPlatform(id)?.shortName ?? id.toUpperCase();
}

export function platformIconPath(id: string): string | undefined {
  return getPlatform(id)?.icon;
}
