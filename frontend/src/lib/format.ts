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
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = cur || "$";
  if (n < 0) return `-${prefix}${abs}`;
  return `${prefix}${abs}`;
}

export function pnlClass(n: number | null | undefined): "up" | "down" | "flat" {
  if (n == null || n === 0) return "flat";
  return n > 0 ? "up" : "down";
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

export function humanEventType(eventType: string | null | undefined): string {
  const map: Record<string, string> = {
    open: "Trade opened",
    close: "Trade closed",
    position_opened: "Copy opened",
    position_closed: "Copy closed",
    modify: "Stop / target changed",
    partial_close: "Partial close",
    balance: "Balance update",
  };
  if (!eventType) return "—";
  return map[eventType] ?? eventType.replace(/_/g, " ");
}

export function humanExecutionStatus(status: string | null | undefined): string {
  const map: Record<string, string> = {
    success: "Copied",
    closed: "Closed",
    pending: "Pending",
    failed: "Failed",
    rejected: "Rejected",
    skipped_risk: "Skipped (risk)",
    skipped_slippage: "Skipped (slippage)",
    duplicate_ignored: "Duplicate ignored",
    partial: "Partial fill",
    modified: "Updated",
  };
  if (!status) return "—";
  return map[status] ?? status.replace(/_/g, " ");
}

export function fmtSpeedMs(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function executionEventToLogRow(e: ExecutionEvent): import("./types").LogRow {
  const side = e.side
    ? e.side.charAt(0).toUpperCase() + e.side.slice(1).toLowerCase()
    : "—";
  const speedMs = e.e2e_ms ?? e.latency_ms ?? 0;
  return {
    id: e.id,
    t: new Date(e.created_at),
    status: executionUiStatus(e.status),
    eventType: humanEventType(e.event_type),
    copierId: e.copier_relation_id ?? "",
    masterTicket: e.master_ticket ?? "—",
    followerTicket: e.follower_ticket ?? "",
    symbol: e.symbol_master ?? "—",
    mapSymbol: e.symbol_follower ?? e.symbol_master ?? "—",
    side,
    lotsReq: e.requested_lot ?? 0,
    lotsExec: e.executed_lot ?? 0,
    latency: speedMs,
    e2eMs: e.e2e_ms ?? e.latency_ms ?? null,
    orderMs: e.order_ms ?? null,
    switchMs: e.switch_ms ?? null,
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

import { platformDisplayName, platformShortName } from "@/lib/platforms";

export function fmtPctChange(current: number, baseline: number | null | undefined): string {
  if (baseline == null || baseline === 0) return "—";
  const pct = ((current - baseline) / Math.abs(baseline)) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}% today`;
}

export function riskAllocationShort(c: import("./types").Copier): string {
  if (c.risk_mode === "multiplier") return `${c.multiplier.toFixed(2)}x`;
  return `${c.fixed_lot_size.toFixed(2)} lots`;
}

export function platformLabel(platform: string): string {
  return platformShortName(platform) || platformDisplayName(platform);
}
