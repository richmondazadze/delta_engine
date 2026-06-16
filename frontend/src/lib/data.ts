import type {
  Account,
  AdminOverview,
  Copier,
  DashboardSummary,
  ExecutionEvent,
  ExecutionSlaResponse,
  RiskProfile,
} from "./types";
import { apiFetch } from "./api";

export async function fetchAccounts(token: string) {
  const data = await apiFetch<{ accounts: Account[]; total: number }>(
    "/api/accounts",
    token,
  );
  return data.accounts;
}

export async function fetchAccount(token: string, id: string) {
  return apiFetch<Account>(`/api/accounts/${id}`, token);
}

export async function createAccount(
  token: string,
  body: {
    platform: string;
    account_number: string;
    broker_server: string;
    password: string;
    account_label?: string;
    api_base_url?: string;
    firm_slug?: string;
    broker_slug?: string;
    terminal_path?: string;
  },
) {
  return apiFetch<Account>("/api/accounts", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAccount(
  token: string,
  id: string,
  body: { account_label?: string; is_enabled?: boolean },
) {
  return apiFetch<Account>(`/api/accounts/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAccount(token: string, id: string) {
  return apiFetch<void>(`/api/accounts/${id}`, token, { method: "DELETE" });
}

export async function testAccountConnection(token: string, id: string) {
  return apiFetch<{
    status: string;
    message?: string;
    account_id?: string;
    balance?: number;
    equity?: number;
  }>(
    `/api/accounts/${id}/test-connection`,
    token,
    { method: "POST" },
  );
}

export async function startAccountSession(token: string, id: string) {
  return apiFetch<{ status: string; message?: string }>(
    `/api/accounts/${id}/start-session`,
    token,
    { method: "POST" },
  );
}

export async function stopAccountSession(token: string, id: string) {
  return apiFetch<{ status: string; message?: string }>(
    `/api/accounts/${id}/stop-session`,
    token,
    { method: "POST" },
  );
}

export async function fetchCopiers(token: string) {
  const data = await apiFetch<{ copiers: Copier[]; total: number }>(
    "/api/copiers",
    token,
  );
  return data.copiers;
}

export async function fetchCopier(token: string, id: string) {
  return apiFetch<Copier>(`/api/copiers/${id}`, token);
}

export async function createCopier(token: string, body: Record<string, unknown>) {
  return apiFetch<Copier>("/api/copiers", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateCopier(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  return apiFetch<Copier>(`/api/copiers/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteCopier(token: string, id: string) {
  return apiFetch<void>(`/api/copiers/${id}`, token, { method: "DELETE" });
}

export async function enableCopier(token: string, id: string) {
  return apiFetch<Copier>(`/api/copiers/${id}/enable`, token, { method: "POST" });
}

export async function disableCopier(token: string, id: string) {
  return apiFetch<Copier>(`/api/copiers/${id}/disable`, token, { method: "POST" });
}

export async function fetchExecutionEvents(
  token: string,
  params: {
    limit?: number;
    offset?: number;
    status?: string;
    status_groups?: string;
    symbol?: string;
    copier_relation_id?: string;
    master_account_id?: string;
    date_from?: string;
    date_to?: string;
  } = {},
) {
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  if (params.status) qs.set("status", params.status);
  if (params.status_groups) qs.set("status_groups", params.status_groups);
  if (params.symbol) qs.set("symbol", params.symbol);
  if (params.copier_relation_id) qs.set("copier_relation_id", params.copier_relation_id);
  if (params.master_account_id) qs.set("master_account_id", params.master_account_id);
  if (params.date_from) qs.set("date_from", params.date_from);
  if (params.date_to) qs.set("date_to", params.date_to);
  const q = qs.toString();
  return apiFetch<{ events: ExecutionEvent[]; total: number; page: number; per_page: number }>(
    `/api/execution-events${q ? `?${q}` : ""}`,
    token,
  );
}

export async function fetchExecutionEvent(token: string, id: string) {
  return apiFetch<ExecutionEvent>(`/api/execution-events/${id}`, token);
}

export async function fetchRiskProfiles(token: string) {
  const data = await apiFetch<{ profiles: RiskProfile[]; total: number }>(
    "/api/risk-profiles",
    token,
  );
  return data.profiles;
}

export async function createRiskProfile(token: string, body: Record<string, unknown>) {
  return apiFetch<RiskProfile>("/api/risk-profiles", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateRiskProfile(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  return apiFetch<RiskProfile>(`/api/risk-profiles/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function unlockRiskProfile(token: string, id: string) {
  return apiFetch<RiskProfile>(`/api/risk-profiles/${id}/unlock`, token, {
    method: "POST",
  });
}

export async function flattenRiskProfile(token: string, id: string) {
  return apiFetch<{ status: string; message: string }>(
    `/api/risk-profiles/${id}/flatten`,
    token,
    { method: "POST" },
  );
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  subscription_plan: string;
  is_active_subscriber: boolean;
  account_limit: number;
  follower_limit: number;
  worker_healthy: boolean;
  online_workers: number;
}

export async function fetchUserProfile(token: string) {
  return apiFetch<UserProfile>("/api/users/me", token);
}

export async function fetchDashboardSummary(token: string) {
  return apiFetch<DashboardSummary>("/api/dashboard/summary", token);
}

export async function fetchAnalyticsSummary(token: string, accountId?: string) {
  const qs = accountId ? `?account_id=${accountId}` : "";
  return apiFetch<{
    total_events: number;
    copied: number;
    failed: number;
    skipped_risk: number;
    skipped_slippage: number;
    duplicate_ignored: number;
    win_rate: number | null;
    symbols: Record<string, number>;
    recent_status_counts: Record<string, number>;
  }>(`/api/analytics/summary${qs}`, token);
}

export async function fetchCompareProfiles(params?: {
  category?: string;
  platform?: string;
  featured_only?: boolean;
}) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.platform) qs.set("platform", params.platform);
  if (params?.featured_only) qs.set("featured_only", "true");
  const q = qs.toString();
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${base}/api/compare${q ? `?${q}` : ""}`);
  if (!res.ok) throw new Error("Failed to load compare data");
  return res.json() as Promise<{
    profiles: Array<{
      id: string;
      slug: string;
      name: string;
      platform: string;
      category: string;
      rating?: number;
      highlights: string[];
      is_featured: boolean;
    }>;
    total: number;
  }>;
}

export async function createBillingCheckout(
  token: string,
  opts: {
    plan: string;
    quantity?: number;
    include_analyzer?: boolean;
  },
) {
  return apiFetch<{ url?: string; message?: string }>(
    "/api/billing/checkout",
    token,
    {
      method: "POST",
      body: JSON.stringify({
        plan: opts.plan,
        quantity: opts.quantity ?? 1,
        include_analyzer: opts.include_analyzer ?? false,
      }),
    },
  );
}

export type BillingPlan = {
  id: string;
  name: string;
  price_usd: number;
  unit: string;
  description: string;
  features: string[];
  configured: boolean;
};

export async function fetchBillingPlans() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${base}/api/billing/plans`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load billing plans");
  return res.json() as Promise<{
    plans: BillingPlan[];
    free_limits: { account_limit: number; follower_limit: number };
  }>;
}

export type SymbolMapping = {
  id: string;
  user_id: string;
  master_account_id: string | null;
  follower_account_id: string | null;
  master_symbol: string;
  follower_symbol: string;
  is_active: boolean;
  created_at: string;
};

export async function fetchExecutionSla(token: string, hours = 24) {
  return apiFetch<ExecutionSlaResponse>(
    `/api/execution-events/sla?hours=${hours}`,
    token,
  );
}

export async function fetchSymbolMappings(token: string) {
  const data = await apiFetch<{ mappings: SymbolMapping[]; total: number }>(
    "/api/symbol-mappings",
    token,
  );
  return data.mappings;
}

export async function createSymbolMapping(
  token: string,
  body: {
    master_account_id?: string;
    follower_account_id?: string;
    master_symbol: string;
    follower_symbol: string;
  },
) {
  return apiFetch<SymbolMapping>("/api/symbol-mappings", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateSymbolMapping(
  token: string,
  id: string,
  body: {
    master_symbol?: string;
    follower_symbol?: string;
    is_active?: boolean;
  },
) {
  return apiFetch<SymbolMapping>(`/api/symbol-mappings/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteSymbolMapping(token: string, id: string) {
  return apiFetch<void>(`/api/symbol-mappings/${id}`, token, { method: "DELETE" });
}

export async function openBillingPortal(token: string) {
  return apiFetch<{ url?: string; message?: string }>(
    "/api/billing/portal",
    token,
    { method: "POST" },
  );
}

export async function fetchAdminOverview(token: string) {
  return apiFetch<AdminOverview>("/api/admin/overview", token);
}

export async function updateAdminUserPlan(
  token: string,
  userId: string,
  subscriptionPlan: string,
) {
  return apiFetch<{ id: string; email: string | null; subscription_plan: string }>(
    `/api/admin/users/${userId}/plan`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({ subscription_plan: subscriptionPlan }),
    },
  );
}
