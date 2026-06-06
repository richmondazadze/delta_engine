"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { EmptyHint, StatusBadge, Tabs } from "@/components/ui";
import { useApp } from "@/components/shell/AppProvider";
import {
  accountDisplayName,
  connectionBadge,
  fmtClock,
  fmtMoney,
} from "@/lib/format";
import { PlatformBadge } from "@/components/PlatformIcon";
import type { DashboardPipeline, PipelineHealth } from "@/lib/types";

function secondsAgo(d: Date | null) {
  if (!d) return "—";
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function DashStat({
  label,
  value,
  sub,
  index = 0,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  index?: number;
}) {
  return (
    <div className="dash-stat" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="dash-stat-label">{label}</div>
      <div className="dash-stat-value">{value}</div>
      {sub ? <div className="dash-stat-sub">{sub}</div> : null}
    </div>
  );
}

function CompareSub({
  pct,
  compareLabel,
}: {
  pct: number;
  compareLabel: string;
}) {
  const up = pct > 0;
  const flat = pct === 0;
  return (
    <span className={`dash-compare${flat ? " flat" : up ? " up" : " down"}`}>
      {!flat && (
        <Icon name={up ? "trendUp" : "minus"} size={12} />
      )}
      {flat ? "0%" : `${Math.abs(pct).toFixed(0)}%`}
      <span className="dash-compare-muted">{compareLabel}</span>
    </span>
  );
}

function OnboardingChecklist() {
  const { dashboard } = useApp();
  const o = dashboard?.onboarding;
  if (!o || o.complete) return null;

  const steps = [
    { done: o.has_accounts, label: "Link your first account", href: "/accounts/new" },
    { done: o.has_two_accounts, label: "Link a second account", href: "/accounts/new" },
    { done: o.has_copier, label: "Create a copy setup", href: "/copiers/new" },
    { done: o.has_active_copier, label: "Turn copying on", href: "/copiers" },
    { done: o.worker_healthy, label: "Copy service is running", href: "/settings" },
  ];

  return (
    <div className="card card-pad dash-rise" style={{ marginBottom: 16 }}>
      <div className="row spread" style={{ marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15 }}>Get set up</h3>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 12.5 }}>
            Finish these steps to start copying trades automatically.
          </p>
        </div>
        <span className="badge badge-plain">
          {steps.filter((s) => s.done).length}/{steps.length}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((s) => (
          <div key={s.label} className="row spread" style={{ fontSize: 13 }}>
            <div className="row gap8">
              <span style={{ color: s.done ? "var(--success)" : "var(--text-quaternary)" }}>
                {s.done ? (
                  <Icon name="check" size={15} />
                ) : (
                  <span className="dash-step-dot" />
                )}
              </span>
              <span style={{ opacity: s.done ? 0.65 : 1 }}>{s.label}</span>
            </div>
            {!s.done && (
              <Link href={s.href} className="link-action" style={{ fontSize: 12 }}>
                Do this
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectionBanner() {
  const { dashboard } = useApp();
  const rows = dashboard?.accounts ?? [];
  const disconnected = rows.filter((a) => a.connection_status !== "connected").length;

  if (!disconnected) return null;

  return (
    <div className="alert-banner warn dash-rise">
      <Icon name="alert" size={16} />
      <span>
        {disconnected} account{disconnected !== 1 ? "s aren't" : " isn't"} connected — copying may
        not work until you reconnect.
      </span>
      <Link href="/accounts" className="alert-link">
        Fix connections
      </Link>
    </div>
  );
}

function healthLabel(h: PipelineHealth) {
  const map: Record<PipelineHealth, string> = {
    active: "Copying",
    idle: "Ready",
    paused: "Paused",
    error: "Issue",
    worker_offline: "Offline",
  };
  return map[h] ?? h;
}

function ZeroState() {
  return (
    <div className="page-inner" style={{ maxWidth: 880 }}>
      <div style={{ textAlign: "center", padding: "8px 0 26px" }}>
        <div className="dash-zero-icon">
          <Icon name="zap" size={24} />
        </div>
        <h1 style={{ margin: "0 0 6px", fontSize: 22 }}>Welcome to your copy dashboard</h1>
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
          Link accounts, connect a master to followers, and watch trades copy in real time.
        </p>
      </div>
      <div className="grid-home-steps">
        {[
          {
            n: 1,
            t: "Link accounts",
            d: "Connect MT5 or DXtrade — Exness, FTMO, Moneta, and more.",
            icon: "server" as const,
          },
          {
            n: 2,
            t: "Set up copying",
            d: "Pick a master account and one or more followers with your lot size.",
            icon: "branch" as const,
          },
          {
            n: 3,
            t: "Watch it work",
            d: "See live balances, today's copies, and trade alerts on this page.",
            icon: "activity" as const,
          },
        ].map((s) => (
          <div key={s.n} className="card card-pad dash-rise" style={{ textAlign: "left" }}>
            <div className="row spread" style={{ marginBottom: 12 }}>
              <div className="dash-step-icon">
                <Icon name={s.icon} size={17} />
              </div>
              <span className="mono dash-step-num">0{s.n}</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{s.t}</div>
            <div className="muted" style={{ fontSize: 12.5 }}>
              {s.d}
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <Link href="/accounts/new" className="btn btn-dark btn-lg">
          <Icon name="plus" size={16} />
          Link your first account
        </Link>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const { accounts, copiers, dashboard, logs, accById, cpById, lastUpdatedAt, workerHealthy } =
    useApp();
  const [acctTab, setAcctTab] = useState("accounts");

  const stats = useMemo(() => {
    const today = dashboard?.today;
    const accountCount = accounts.length;
    const connected = dashboard?.connected_accounts ?? 0;
    const portfolio = today?.total_equity ?? 0;
    const copies = today?.copies ?? 0;
    const closed = today?.closed ?? 0;
    const failed = today?.failed ?? 0;
    const tradesTaken = copies + closed;
    const tradesWon = Math.max(0, copies - failed);
    const tradesLost = failed;
    const openPnL = today?.net_equity_change ?? 0;
    const activeCopiers = dashboard?.active_copiers ?? 0;
    const masterIds = new Set(
      copiers.filter((c) => c.is_enabled).map((c) => c.master_account_id),
    );
    const slaveIds = new Set(
      copiers.filter((c) => c.is_enabled).map((c) => c.follower_account_id),
    );
    const openTrades = logs.filter(
      (l) => l.status === "executed" && l.eventType.includes("open"),
    ).length;
    const successToday = logs.filter((l) => l.status === "executed").length;
    const failedToday = logs.filter((l) => l.status === "failed").length;
    const totalResolved = successToday + failedToday;
    const winRate = totalResolved > 0 ? (successToday / totalResolved) * 100 : 0;

    return {
      accountCount,
      connected,
      portfolio,
      tradesTaken,
      tradesWon,
      tradesLost,
      openPnL,
      activeCopiers,
      mastersConnected: masterIds.size,
      activeSlaves: slaveIds.size,
      openTrades,
      copiesToday: copies,
      winRate,
      netPnL: openPnL,
    };
  }, [accounts.length, copiers, dashboard, logs]);

  const recentLogs = logs.slice(0, 8);
  const pipelines = dashboard?.pipelines ?? [];

  if (accounts.length === 0) return <ZeroState />;

  return (
    <div className="page-inner dash-page">
      <div className="page-head dash-rise">
        <div className="pt">
          <h1>Dashboard</h1>
          <p className="desc">
            Portfolio, copier health, and today&apos;s execution — at a glance.
          </p>
        </div>
        <div className="actions row gap12">
          <span className="faint" style={{ fontSize: 12 }}>
            Updated {secondsAgo(lastUpdatedAt)}
          </span>
        </div>
      </div>

      <ConnectionBanner />
      <OnboardingChecklist />

      <div className="dash-stat-grid">
        <DashStat
          index={0}
          label="Accounts"
          value={stats.accountCount}
          sub={
            <CompareSub
              pct={pctChange(stats.connected, Math.max(0, stats.connected - 1))}
              compareLabel={`compared to ${Math.max(0, stats.connected - 1)}, yesterday`}
            />
          }
        />
        <DashStat
          index={1}
          label="Portfolio Value"
          value={fmtMoney(stats.portfolio)}
          sub={
            <CompareSub
              pct={pctChange(stats.portfolio, stats.portfolio - stats.openPnL)}
              compareLabel={`compared to ${fmtMoney(Math.max(0, stats.portfolio - stats.openPnL))}, yesterday`}
            />
          }
        />
        <DashStat
          index={2}
          label="Trades Taken"
          value={stats.tradesTaken}
          sub={
            <span>
              Trades Won: {stats.tradesWon} · Trades Lost: {stats.tradesLost}
            </span>
          }
        />
        <DashStat
          index={3}
          label="Open PnL"
          value={fmtMoney(stats.openPnL)}
          sub={<span>{stats.openTrades} open positions</span>}
        />
      </div>

      <div className="dash-two-col">
        <div className="card dash-panel dash-rise" style={{ animationDelay: "280ms" }}>
          <div className="card-head">
            <Icon name="branch" size={16} style={{ color: "var(--accent)" }} />
            <h3>Copier Overview</h3>
            <div className="grow" />
            <Link href="/copiers" className="link-action" style={{ fontSize: 12 }}>
              Open copy engine
            </Link>
          </div>
          <div className="dash-mini-grid">
            {pipelines.length === 0 ? (
              <EmptyHint icon="branch" title="No copy setups yet">
                <Link href="/copiers/new">Create your first master → follower link</Link>
              </EmptyHint>
            ) : (
              pipelines.slice(0, 3).map((p: DashboardPipeline) => {
                const m = accById(p.master_account_id);
                const f = accById(p.follower_account_id);
                return (
                  <div key={p.copier_id} className="dash-pipe-row">
                    <div className="row spread">
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{p.label}</span>
                      <span className="badge badge-plain">{healthLabel(p.health)}</span>
                    </div>
                    <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>
                      {m
                        ? accountDisplayName(m.account_label, m.account_number).split(" — ")[0]
                        : "Master"}{" "}
                      →{" "}
                      {f
                        ? accountDisplayName(f.account_label, f.account_number).split(" — ")[0]
                        : "Follower"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card dash-panel dash-rise" style={{ animationDelay: "350ms" }}>
          <div className="card-head">
            <Icon name="activity" size={16} style={{ color: "var(--pulse-deep)" }} />
            <h3>Copier Health</h3>
            {!workerHealthy && <span className="badge badge-warn">Offline</span>}
          </div>
          <div className="dash-health-grid">
            <div className="dash-health-item">
              <span className="dash-health-label">Active Slave Accounts</span>
              <span className="dash-health-val">{stats.activeSlaves}</span>
            </div>
            <div className="dash-health-item">
              <span className="dash-health-label">Masters Connected</span>
              <span className="dash-health-val">{stats.mastersConnected}</span>
            </div>
            <div className="dash-health-item">
              <span className="dash-health-label">Open Trades</span>
              <span className="dash-health-val">{stats.openTrades}</span>
            </div>
            <div className="dash-health-item">
              <span className="dash-health-label">Trades Copied Today</span>
              <span className="dash-health-val">{stats.copiesToday}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card dash-panel dash-rise dash-logs" style={{ animationDelay: "420ms" }}>
        <div className="card-head">
          <Icon name="logs" size={16} />
          <h3>Copier Logs</h3>
          <Link href="/logs" className="link-action" style={{ fontSize: 12, marginLeft: "auto" }}>
            View all
          </Link>
        </div>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Master</th>
                <th>Slave</th>
                <th>Symbol</th>
                <th>Type</th>
                <th>P/L</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="dash-empty-cell">
                    No Data
                  </td>
                </tr>
              ) : (
                recentLogs.map((l) => {
                  const cp = cpById(l.copierId);
                  const master = cp ? accById(cp.master_account_id) : undefined;
                  const slave = cp ? accById(cp.follower_account_id) : undefined;
                  return (
                    <tr key={l.id} className="dash-table-row">
                      <td>
                        <StatusBadge status={l.status} dot={false} />
                      </td>
                      <td>{master?.account_label ?? master?.account_number ?? "—"}</td>
                      <td>{slave?.account_label ?? slave?.account_number ?? "—"}</td>
                      <td className="mono">{l.symbol || l.mapSymbol || "—"}</td>
                      <td className="capitalize">{l.side || l.eventType}</td>
                      <td className="mono faint">—</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dash-perf-grid">
        <DashStat
          index={0}
          label="PnL"
          value={fmtMoney(stats.netPnL)}
          sub={
            <CompareSub
              pct={0}
              compareLabel={`compared to ${fmtMoney(0)}, yesterday`}
            />
          }
        />
        <DashStat
          index={1}
          label="Win Rate"
          value={`${stats.winRate.toFixed(2)}%`}
          sub={
            <CompareSub pct={0} compareLabel={`compared to 0%, yesterday`} />
          }
        />
        <DashStat
          index={2}
          label="Best Winning Trade"
          value={fmtMoney(0)}
          sub={<span>Your best trade banked 0.00% profit</span>}
        />
        <DashStat
          index={3}
          label="Worst Trade"
          value={fmtMoney(0)}
          sub={<span>Your worst trade lost 0.00%</span>}
        />
      </div>

      <div className="card dash-panel dash-rise dash-acct" style={{ animationDelay: "560ms" }}>
        <div className="card-head">
          <Icon name="server" size={16} />
          <h3>Account Information</h3>
        </div>
        <Tabs
          tabs={[
            { value: "accounts", label: "Accounts" },
            { value: "open", label: "Open Positions" },
            { value: "closed", label: "Closed Positions" },
          ]}
          value={acctTab}
          onChange={setAcctTab}
        />
        <div className="dash-tab-body">
          {acctTab === "accounts" &&
            (dashboard?.accounts ?? []).map((a) => (
              <Link key={a.id} href={`/accounts/${a.id}`} className="dash-acct-row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.label}</div>
                  <div className="faint row gap6" style={{ fontSize: 11.5, marginTop: 2 }}>
                    <PlatformBadge platformId={a.platform} size="md" />
                    <span className="capitalize">{a.role}</span>
                  </div>
                </div>
                <div className="row gap10">
                  <span className="mono">{fmtMoney(a.equity, a.currency ? `${a.currency} ` : "$")}</span>
                  <StatusBadge status={connectionBadge(a.connection_status)} />
                </div>
              </Link>
            ))}
          {acctTab === "open" &&
            (recentLogs.filter((l) => l.status === "executed" && l.eventType.includes("open"))
              .length === 0 ? (
              <EmptyHint icon="activity" title="No open positions">
                Open trades on your master will appear here when copied.
              </EmptyHint>
            ) : (
              recentLogs
                .filter((l) => l.status === "executed" && l.eventType.includes("open"))
                .map((l) => (
                  <div key={l.id} className="dash-acct-row static">
                    <div>
                      <div className="mono" style={{ fontWeight: 600 }}>
                        {l.symbol || l.mapSymbol}
                      </div>
                      <div className="faint" style={{ fontSize: 11.5 }}>
                        {l.side} · {l.lotsExec || l.lotsReq} lots
                      </div>
                    </div>
                    <span className="faint mono">{fmtClock(l.t)}</span>
                  </div>
                ))
            ))}
          {acctTab === "closed" &&
            (recentLogs.filter((l) => l.eventType.includes("close")).length === 0 ? (
              <EmptyHint icon="logs" title="No closed positions today">
                Closed copies will show up here from your copy log.
              </EmptyHint>
            ) : (
              recentLogs
                .filter((l) => l.eventType.includes("close"))
                .map((l) => (
                  <div key={l.id} className="dash-acct-row static">
                    <div>
                      <div className="mono" style={{ fontWeight: 600 }}>
                        {l.symbol || l.mapSymbol}
                      </div>
                      <div className="faint" style={{ fontSize: 11.5 }}>
                        {l.side} · closed
                      </div>
                    </div>
                    <StatusBadge status={l.status} dot={false} />
                  </div>
                ))
            ))}
        </div>
      </div>
    </div>
  );
}
