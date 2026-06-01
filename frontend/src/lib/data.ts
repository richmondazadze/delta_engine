import type {
  Account,
  Copier,
  ExecutionEvent,
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
  return apiFetch<{ status: string; message?: string }>(
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
    symbol?: string;
    copier_relation_id?: string;
  } = {},
) {
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  if (params.status) qs.set("status", params.status);
  if (params.symbol) qs.set("symbol", params.symbol);
  if (params.copier_relation_id) qs.set("copier_relation_id", params.copier_relation_id);
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
