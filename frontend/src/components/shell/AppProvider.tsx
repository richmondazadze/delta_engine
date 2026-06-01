"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Account, Copier, LogRow, RiskProfile, Toast, ToastKind } from "@/lib/types";
import { executionEventToLogRow } from "@/lib/format";
import * as api from "@/lib/data";

interface AppContextValue {
  loading: boolean;
  email: string;
  accountLimit: number;
  accounts: Account[];
  copiers: Copier[];
  riskProfiles: RiskProfile[];
  logs: LogRow[];
  logsTotal: number;
  paused: boolean;
  setPaused: (v: boolean) => void;
  toasts: Toast[];
  toast: (msg: string, kind?: ToastKind) => void;
  refreshAll: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  accById: (id: string) => Account | undefined;
  cpById: (id: string) => Copier | undefined;
  riskByAccountId: (accountId: string) => RiskProfile | undefined;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [accountLimit, setAccountLimit] = useState(2);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [copiers, setCopiers] = useState<Copier[]>([]);
  const [riskProfiles, setRiskProfiles] = useState<RiskProfile[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [paused, setPaused] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((msg: string, kind: ToastKind = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const loadData = useCallback(
    async (accessToken: string) => {
      const [accs, cps, risks, events] = await Promise.all([
        api.fetchAccounts(accessToken),
        api.fetchCopiers(accessToken),
        api.fetchRiskProfiles(accessToken),
        api.fetchExecutionEvents(accessToken, { limit: 200 }),
      ]);
      setAccounts(accs);
      setCopiers(cps);
      setRiskProfiles(risks);
      setLogs(events.events.map(executionEventToLogRow));
      setLogsTotal(events.total);
      setAccountLimit(2);
    },
    [],
  );

  const refreshAll = useCallback(async () => {
    if (!token) return;
    try {
      await loadData(token);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to refresh data", "err");
    }
  }, [token, loadData, toast]);

  const refreshLogs = useCallback(async () => {
    if (!token) return;
    try {
      const events = await api.fetchExecutionEvents(token, { limit: 200 });
      setLogs(events.events.map(executionEventToLogRow));
      setLogsTotal(events.total);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to refresh logs", "err");
    }
  }, [token, toast]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.access_token) {
        setToken(session.access_token);
        setEmail(session.user.email ?? "");
        try {
          await loadData(session.access_token);
        } catch (e) {
          toast(e instanceof Error ? e.message : "Failed to load dashboard", "err");
        }
      }
      setLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token) {
        setToken(session.access_token);
        setEmail(session.user.email ?? "");
        try {
          await loadData(session.access_token);
        } catch {
          /* handled on next refresh */
        }
      } else {
        setToken(null);
        setEmail("");
        setAccounts([]);
        setCopiers([]);
        setRiskProfiles([]);
        setLogs([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth, loadData, toast]);

  useEffect(() => {
    if (paused || !token) return;
    const id = setInterval(() => {
      refreshLogs();
    }, 8000);
    return () => clearInterval(id);
  }, [paused, token, refreshLogs]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase.auth]);

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
      email,
      accountLimit,
      accounts,
      copiers,
      riskProfiles,
      logs,
      logsTotal,
      paused,
      setPaused,
      toasts,
      toast,
      refreshAll,
      refreshLogs,
      accById: (id) => accounts.find((a) => a.id === id),
      cpById: (id) => copiers.find((c) => c.id === id),
      riskByAccountId: (accountId) =>
        riskProfiles.find((r) => r.account_id === accountId),
      signOut,
    }),
    [
      loading,
      email,
      accountLimit,
      accounts,
      copiers,
      riskProfiles,
      logs,
      logsTotal,
      paused,
      toasts,
      toast,
      refreshAll,
      refreshLogs,
      signOut,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAccessToken() {
  const supabase = createClient();
  return useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, [supabase.auth]);
}
