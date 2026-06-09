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
  api_base_url?: string | null;
  account_metadata?: Record<string, unknown>;
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
  switch_ms?: number | null;
  order_ms?: number | null;
  e2e_ms?: number | null;
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
  e2eMs?: number | null;
  orderMs?: number | null;
  switchMs?: number | null;
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

export type AccountRole = "master" | "follower" | "standalone";

export type PipelineHealth =
  | "active"
  | "idle"
  | "paused"
  | "error"
  | "worker_offline";

export interface DashboardAccount {
  id: string;
  label: string;
  account_number: string;
  platform: PlatformType;
  connection_status: ConnectionStatus;
  balance: number | null;
  equity: number | null;
  currency: string | null;
  role: AccountRole;
  daily_equity_change: number | null;
  last_balance_sync_at: string | null;
}

export interface DashboardPipeline {
  copier_id: string;
  label: string;
  master_account_id: string;
  follower_account_id: string;
  is_enabled: boolean;
  allocation: string;
  last_event_at: string | null;
  last_status: string | null;
  last_symbol: string | null;
  last_event_type: string | null;
  last_error_message: string | null;
  health: PipelineHealth;
}

export interface DashboardActivity {
  id: string;
  at: string;
  status: string | null;
  event_type: string | null;
  symbol: string | null;
  side: string | null;
  copier_id: string | null;
  master_account_id: string | null;
  follower_account_id: string | null;
  latency_ms: number | null;
  message: string;
}

export interface DashboardOnboarding {
  has_accounts: boolean;
  has_two_accounts: boolean;
  has_copier: boolean;
  has_active_copier: boolean;
  worker_healthy: boolean;
  has_copy_today: boolean;
  complete: boolean;
}

export interface DashboardSummary {
  as_of: string;
  worker_healthy: boolean;
  online_workers: number;
  today: {
    copies: number;
    closed: number;
    failed: number;
    net_equity_change: number | null;
    total_equity: number | null;
    equity_open: number | null;
    copy_success_rate: number | null;
    avg_latency_ms: number | null;
  };
  accounts: DashboardAccount[];
  pipelines: DashboardPipeline[];
  recent_activity: DashboardActivity[];
  onboarding: DashboardOnboarding;
  active_copiers: number;
  connected_accounts: number;
}

export interface AdminStats {
  users_total: number;
  users_by_plan: Record<string, number>;
  accounts_total: number;
  accounts_connected: number;
  accounts_by_status: Record<string, number>;
  copiers_total: number;
  copiers_active: number;
  copies_today: number;
  failed_today: number;
  avg_e2e_ms_today: number | null;
  avg_order_ms_today: number | null;
  avg_switch_ms_today: number | null;
  pending_commands: number;
  online_workers: number;
  workers_total: number;
  active_sessions: number;
}

export interface AdminUserRow {
  id: string;
  email: string | null;
  subscription_plan: string;
  is_active_subscriber: boolean;
  created_at: string | null;
}

export interface AdminWorkerRow {
  id: string;
  worker_name: string | null;
  region: string | null;
  host_identifier: string | null;
  status: string | null;
  capacity: number | null;
  active_sessions: number | null;
  last_heartbeat_at: string | null;
  online: boolean;
}

export interface AdminFailedEvent {
  id: string;
  user_id: string;
  event_type: string | null;
  status: string;
  master_ticket: string | null;
  follower_ticket: string | null;
  symbol_master: string | null;
  error_message: string | null;
  e2e_ms: number | null;
  order_ms: number | null;
  switch_ms: number | null;
  created_at: string;
}

export interface AdminRecentExecution {
  id: string;
  user_id: string;
  user_email?: string | null;
  event_type: string | null;
  status: string;
  symbol_master: string | null;
  copier_relation_id: string | null;
  e2e_ms: number | null;
  order_ms: number | null;
  switch_ms: number | null;
  latency_ms: number | null;
  created_at: string;
}

export interface AdminOverview {
  as_of: string;
  stats: AdminStats;
  users: AdminUserRow[];
  workers: AdminWorkerRow[];
  sessions: Record<string, unknown>[];
  failed_events: AdminFailedEvent[];
  recent_executions: AdminRecentExecution[];
  user_emails: Record<string, string | null>;
}
