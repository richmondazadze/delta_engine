import type { Account, Copier } from "./types";

export interface MasterCopierGroup {
  masterId: string;
  master: Account | undefined;
  copiers: Copier[];
  allEnabled: boolean;
  anyEnabled: boolean;
}

export function groupCopiersByMaster(
  copiers: Copier[],
  accById: (id: string) => Account | undefined,
): MasterCopierGroup[] {
  const byMaster = new Map<string, Copier[]>();
  for (const c of copiers) {
    const list = byMaster.get(c.master_account_id) ?? [];
    list.push(c);
    byMaster.set(c.master_account_id, list);
  }

  return Array.from(byMaster.entries()).map(([masterId, list]) => {
    const sorted = [...list].sort((a, b) =>
      (a.label ?? "").localeCompare(b.label ?? ""),
    );
    return {
      masterId,
      master: accById(masterId),
      copiers: sorted,
      allEnabled: sorted.every((c) => c.is_enabled),
      anyEnabled: sorted.some((c) => c.is_enabled),
    };
  });
}

export function riskAllocationDisplay(c: Copier): { type: string; setting: string } {
  if (c.risk_mode === "multiplier") {
    return {
      type: "Balance multiplier",
      setting: `${(c.multiplier * 100).toFixed(0)}%`,
    };
  }
  if (c.risk_mode === "fixed_lot") {
    return {
      type: "Fixed lot size",
      setting: `${c.fixed_lot_size.toFixed(2)} lots`,
    };
  }
  return {
    type: c.risk_mode.replace(/_/g, " "),
    setting: "—",
  };
}

export function copierEngineStats(
  copiers: Copier[],
  accounts: Account[],
  totalEquity: number | null | undefined,
) {
  const masterIds = new Set(copiers.map((c) => c.master_account_id));
  const equity =
    totalEquity ??
    accounts.reduce((sum, a) => sum + (a.equity ?? 0), 0);

  return {
    portfolioValue: equity > 0 ? equity : null,
    masters: masterIds.size,
    followers: copiers.length,
    active: copiers.filter((c) => c.is_enabled).length,
  };
}
