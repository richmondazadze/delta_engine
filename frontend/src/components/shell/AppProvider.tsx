"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  Account,
  Copier,
  DashboardSummary,
  LogRow,
  RiskProfile,
  Toast,
  ToastKind,
} from "@/lib/types";
import { executionEventToLogRow } from "@/lib/format";
import * as api from "@/lib/data";

const DASHBOARD_POLL_MS = 5_000;
const CONTEXT_LOGS_POLL_MS = 15_000;

interface AppContextValue {
  loading: boolean;
  email: string;
  accountLimit: number;
  followerLimit: number;
  subscriptionPlan: string;
  workerHealthy: boolean;
  accounts: Account[];
  copiers: Copier[];
  riskProfiles: RiskProfile[];
  logs: LogRow[];
  logsTotal: number;
  dashboard: DashboardSummary | null;
  lastUpdatedAt: Date | null;
  paused: boolean;
  setPaused: (v: boolean) => void;
  toasts: Toast[];
  toast: (msg: string, kind?: ToastKind) => void;
  refreshAll: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
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
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [accountLimit, setAccountLimit] = useState(2);
  const [followerLimit, setFollowerLimit] = useState(1);
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [workerHealthy, setWorkerHealthy] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [copiers, setCopiers] = useState<Copier[]>([]);
  const [riskProfiles, setRiskProfiles] = useState<RiskProfile[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [paused, setPaused] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seenActivityIds = useRef<Set<string>>(new Set());
  const activityBootstrapped = useRef(false);
  const refreshBusy = useRef(false);

  const toast = useCallback((msg: string, kind: ToastKind = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const processNewActivity = useCallback(
    (summary: DashboardSummary) => {
      const copyEvents = summary.recent_activity.filter(
        (a) =>
          a.event_type === "position_opened" &&
          (a.status === "success" || a.status === "failed" || a.status === "rejected"),
      );
      if (!activityBootstrapped.current) {
        copyEvents.forEach((a) => seenActivityIds.current.add(a.id));
        activityBootstrapped.current = true;
        return;
      }
      for (const a of copyEvents) {
        if (seenActivityIds.current.has(a.id)) continue;
        seenActivityIds.current.add(a.id);
        const kind: ToastKind =
          a.status === "success" ? "ok" : "err";
        toast(a.message, kind);
      }
    },
    [toast],
  );

  const loadData = useCallback(
    async (accessToken: string) => {
      const [accs, cps, risks, events, profile, dash] = await Promise.all([
        api.fetchAccounts(accessToken),
        api.fetchCopiers(accessToken),
        api.fetchRiskProfiles(accessToken),
        api.fetchExecutionEvents(accessToken, { limit: 80 }),
        api.fetchUserProfile(accessToken),
        api.fetchDashboardSummary(accessToken),
      ]);
      setAccounts(accs);
      setCopiers(cps);
      setRiskProfiles(risks);
      setLogs(events.events.map(executionEventToLogRow));
      setLogsTotal(events.total);
      setAccountLimit(profile.account_limit);
      setFollowerLimit(profile.follower_limit);
      setSubscriptionPlan(profile.subscription_plan);
      setWorkerHealthy(profile.worker_healthy);
      setDashboard(dash);
      setLastUpdatedAt(new Date());
      processNewActivity(dash);
    },
    [processNewActivity],
  );

  const refreshDashboard = useCallback(async () => {
    if (!token || refreshBusy.current) return;
    refreshBusy.current = true;
    try {
      const dash = await api.fetchDashboardSummary(token);
      setDashboard(dash);
      setWorkerHealthy(dash.worker_healthy);
      setLastUpdatedAt(new Date());
      processNewActivity(dash);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to refresh dashboard", "err");
    } finally {
      refreshBusy.current = false;
    }
  }, [token, processNewActivity, toast]);

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
      const events = await api.fetchExecutionEvents(token, {
        limit: 80,
        date_from: new Date(Date.now() - 86400000).toISOString(),
      });
      setLogs(events.events.map(executionEventToLogRow));
      setLogsTotal(events.total);
      setLastUpdatedAt(new Date());
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to refresh activity", "err");
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
        activityBootstrapped.current = false;
        seenActivityIds.current.clear();
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
        setDashboard(null);
        setLastUpdatedAt(null);
        activityBootstrapped.current = false;
        seenActivityIds.current.clear();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth, loadData, toast]);

  useEffect(() => {
    if (paused || !token) return;

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      refreshDashboard();
      if (pathname !== "/logs") {
        refreshLogs();
      }
    };

    tick();
    const id = setInterval(tick, DASHBOARD_POLL_MS);
    const logsId =
      pathname === "/logs"
        ? undefined
        : setInterval(() => {
            if (document.visibilityState === "visible") refreshLogs();
          }, CONTEXT_LOGS_POLL_MS);

    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(id);
      if (logsId) clearInterval(logsId);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [paused, token, pathname, refreshDashboard, refreshLogs]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [supabase.auth, router]);

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
      email,
      accountLimit,
      followerLimit,
      subscriptionPlan,
      workerHealthy,
      accounts,
      copiers,
      riskProfiles,
      logs,
      logsTotal,
      dashboard,
      lastUpdatedAt,
      paused,
      setPaused,
      toasts,
      toast,
      refreshAll,
      refreshLogs,
      refreshDashboard,
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
      followerLimit,
      subscriptionPlan,
      workerHealthy,
      accounts,
      copiers,
      riskProfiles,
      logs,
      logsTotal,
      dashboard,
      lastUpdatedAt,
      paused,
      toasts,
      toast,
      refreshAll,
      refreshLogs,
      refreshDashboard,
      signOut,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAccessToken() {
  const supabase = createClient();
  return useCallback(async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, [supabase.auth]);
}
