import type { ExecutionEvent, ExecutionStatus } from "./types";

export function fmtClock(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);
}

export function fmtMoney(n: number | null | undefined, cur = ""): string {
  if (n == null) return "—";
  const s = n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return cur ? `${cur}${s}` : `$${s}`;
}

export function fmtInt(n: number): string {
  return n.toLocaleString("en-US");
}

export function latClass(ms: number): "g" | "a" | "r" {
  if (ms <= 500) return "g";
  if (ms <= 2000) return "a";
  return "r";
}

export function connectionBadge(status: string): string {
  const map: Record<string, string> = {
    connected: "Connected",
    disconnected: "Disconnected",
    auth_failed: "Auth Failed",
    terminal_unavailable: "Terminal Unavailable",
    broker_unavailable: "Broker Unavailable",
    disabled: "Disabled",
    locked: "Locked",
  };
  return map[status] ?? status;
}

export function executionUiStatus(status: ExecutionStatus): string {
  const map: Record<ExecutionStatus, string> = {
    success: "executed",
    pending: "pending",
    failed: "failed",
    rejected: "failed",
    skipped_risk: "skipped",
    skipped_slippage: "skipped",
    duplicate_ignored: "skipped",
    partial: "executed",
    closed: "executed",
    modified: "executed",
  };
  return map[status] ?? "pending";
}

export function executionEventToLogRow(e: ExecutionEvent): import("./types").LogRow {
  const side = e.side
    ? e.side.charAt(0).toUpperCase() + e.side.slice(1).toLowerCase()
    : "—";
  return {
    id: e.id,
    t: new Date(e.created_at),
    status: executionUiStatus(e.status),
    eventType: e.event_type,
    copierId: e.copier_relation_id ?? "",
    masterTicket: e.master_ticket ?? "—",
    followerTicket: e.follower_ticket ?? "",
    symbol: e.symbol_master ?? "—",
    mapSymbol: e.symbol_follower ?? e.symbol_master ?? "—",
    side,
    lotsReq: e.requested_lot ?? 0,
    lotsExec: e.executed_lot ?? 0,
    latency: e.latency_ms ?? 0,
    code: e.broker_return_code ?? "—",
    entryPrice: e.requested_price?.toString() ?? "—",
    fillPrice: e.executed_price?.toString() ?? "—",
    slippagePips: e.slippage_points ?? 0,
    volume: e.executed_lot ?? e.requested_lot ?? 0,
    client: "worker",
    hash: e.id.slice(0, 8),
    raw: e,
  };
}

export function accountDisplayName(label: string | null, accountNumber: string): string {
  return label?.trim() || `Account ${accountNumber}`;
}

export function initials(email: string): string {
  const part = email.split("@")[0] ?? "U";
  return part.slice(0, 2).toUpperCase();
}

export function platformLabel(platform: string): string {
  if (platform === "mt5") return "MT5";
  if (platform === "mt4") return "MT4";
  return platform.toUpperCase();
}
