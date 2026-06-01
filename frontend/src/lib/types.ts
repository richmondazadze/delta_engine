export type PlatformType =
  | "mt5"
  | "mt4"
  | "ctrader"
  | "dxtrade"
  | "matchtrader"
  | "tradelocker"
  | "ninjatrader"
  | "tradingview";

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "auth_failed"
  | "terminal_unavailable"
  | "broker_unavailable"
  | "disabled"
  | "locked";

export type AccountMode = "hedging" | "netting" | "unknown";

export interface Account {
  id: string;
  user_id: string;
  platform: PlatformType;
  account_number: string;
  broker_server: string;
  account_label: string | null;
  account_mode: AccountMode;
  connection_status: ConnectionStatus;
  balance: number | null;
  equity: number | null;
  currency: string | null;
  leverage: number | null;
  last_connected_at: string | null;
  last_error: string | null;
  is_enabled: boolean;
  created_at: string;
}

export type RiskMode = "multiplier" | "fixed_lot" | "equity_ratio" | "risk_percent";

export interface Copier {
  id: string;
  user_id: string;
  master_account_id: string;
  follower_account_id: string;
  label: string | null;
  risk_mode: RiskMode;
  multiplier: number;
  fixed_lot_size: number;
  copy_sl: boolean;
  copy_tp: boolean;
  copy_closes: boolean;
  copy_modifications: boolean;
  max_signal_age_ms: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string | null;
}

export type ExecutionStatus =
  | "pending"
  | "success"
  | "failed"
  | "rejected"
  | "skipped_risk"
  | "skipped_slippage"
  | "duplicate_ignored"
  | "partial"
  | "closed"
  | "modified";

export interface ExecutionEvent {
  id: string;
  user_id: string;
  copier_relation_id: string | null;
  master_account_id: string | null;
  follower_account_id: string | null;
  event_type: string;
  master_ticket: string | null;
  follower_ticket: string | null;
  symbol_master: string | null;
  symbol_follower: string | null;
  side: string | null;
  requested_lot: number | null;
  executed_lot: number | null;
  requested_price: number | null;
  executed_price: number | null;
  slippage_points: number | null;
  latency_ms: number | null;
  status: ExecutionStatus;
  broker_return_code: string | null;
  error_message: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}

export interface RiskProfile {
  id: string;
  user_id: string;
  account_id: string;
  max_daily_loss: number | null;
  max_total_loss: number | null;
  min_equity: number | null;
  max_lot_per_trade: number | null;
  max_open_positions: number;
  max_trades_per_day: number | null;
  allowed_symbols: string[] | null;
  blocked_symbols: string[] | null;
  news_pause_enabled: boolean;
  lock_after_loss: boolean;
  auto_flatten_enabled: boolean;
  is_locked: boolean;
  locked_reason: string | null;
  locked_at: string | null;
  daily_loss_accumulated: number;
  daily_trades_count: number;
  created_at: string;
}

export interface UserProfile {
  account_limit: number;
  plan_name?: string;
}

export interface LogRow {
  id: string;
  t: Date;
  status: string;
  eventType: string;
  copierId: string;
  masterTicket: string;
  followerTicket: string;
  symbol: string;
  mapSymbol: string;
  side: string;
  lotsReq: number;
  lotsExec: number;
  latency: number;
  code: string;
  entryPrice: string;
  fillPrice: string;
  slippagePips: number;
  volume: number;
  client: string;
  hash: string;
  raw: ExecutionEvent;
}

export type ToastKind = "ok" | "err";

export interface Toast {
  id: string;
  msg: string;
  kind: ToastKind;
}
