"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { EmptyHint, StatusBadge, Tabs } from "@/components/ui";
import { useApp } from "@/components/shell/AppProvider";
import { PageIntro } from "@/components/shell/PageIntro";
import {
  accountDisplayName,
  connectionBadge,
  fmtClock,
  fmtMoney,
  fmtPctChange,
  fmtSpeedMs,
  humanExecutionStatus,
  pnlClass,
} from "@/lib/format";
import { PlatformBadge } from "@/components/PlatformIcon";
import type { DashboardPipeline, LogRow, PipelineHealth } from "@/lib/types";

function secondsAgo(d: Date | null) {
  if (!d) return "—";
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

function isOpenCopyLog(l: LogRow) {
  return l.raw?.event_type === "position_opened" && l.raw?.status === "success";
}

function isClosedCopyLog(l: LogRow) {
  return l.raw?.event_type === "position_closed" && l.raw?.status === "closed";
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
  const valueIsPlain = typeof value === "string" || typeof value === "number";
  return (
    <div className="dash-stat" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="dash-stat-label">{label}</div>
      {valueIsPlain ? <div className="dash-stat-value">{value}</div> : value}
      {sub ? <div className="dash-stat-sub">{sub}</div> : null}
    </div>
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
    <div className="card card-pad dash-rise dash-section" style={{ animationDelay: "0ms" }}>
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
    <div className="alert-banner warn dash-rise dash-section">
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
    error: "Needs fix",
    worker_offline: "Offline",
  };
  return map[h] ?? h;
}

function healthBadgeClass(h: PipelineHealth) {
  if (h === "active") return "badge-ok";
  if (h === "error" || h === "worker_offline") return "badge-err";
  if (h === "paused") return "badge-warn";
  return "badge-muted";
}

function pipelineDetail(p: DashboardPipeline) {
  if (p.health === "error" && p.last_status) {
    const status = humanExecutionStatus(p.last_status);
    const symbol = p.last_symbol ? ` · ${p.last_symbol}` : "";
    const err = p.last_error_message?.replace(/_/g, " ");
    if (err) return `${status}${symbol} — ${err}`;
    return `Last event: ${status}${symbol}`;
  }
  if (p.health === "active" && p.last_symbol) {
    return `Last copied: ${p.last_symbol}`;
  }
  if (p.health === "idle") return "No copy events today";
  if (p.health === "worker_offline") return "Copy service not reachable";
  if (p.health === "paused") return "Turn this setup on in copy engine";
  return null;
}

function copierHealthSummary(pipelines: DashboardPipeline[], workerHealthy: boolean) {
  if (!workerHealthy) return { label: "Offline", tone: "warn" as const };
  if (pipelines.some((p) => p.health === "error")) return { label: "Needs attention", tone: "warn" as const };
  if (pipelines.some((p) => p.health === "active")) return { label: "Stable", tone: "ok" as const };
  if (pipelines.length === 0) return { label: "No setups", tone: "plain" as const };
  return { label: "Ready", tone: "plain" as const };
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
            d: "See updated balances, today's copies, and trade alerts on this page.",
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
    const equityOpen = today?.equity_open ?? null;
    const copies = today?.copies ?? 0;
    const closed = today?.closed ?? 0;
    const failed = today?.failed ?? 0;
    const dailyPnL = today?.net_equity_change ?? null;
    const copySuccessRate = today?.copy_success_rate ?? null;
    const avgLatency = today?.avg_latency_ms ?? null;
    const activeCopiers = dashboard?.active_copiers ?? 0;
    const masterIds = new Set(
      copiers.filter((c) => c.is_enabled).map((c) => c.master_account_id),
    );
    const slaveIds = new Set(
      copiers.filter((c) => c.is_enabled).map((c) => c.follower_account_id),
    );

    return {
      accountCount,
      connected,
      portfolio,
      equityOpen,
      copies,
      closed,
      failed,
      dailyPnL,
      copySuccessRate,
      avgLatency,
      activeCopiers,
      mastersConnected: masterIds.size,
      activeSlaves: slaveIds.size,
    };
  }, [accounts.length, copiers, dashboard]);

  const recentLogs = logs.slice(0, 10);
  const openCopyLogs = useMemo(() => logs.filter(isOpenCopyLog).slice(0, 12), [logs]);
  const closedCopyLogs = useMemo(() => logs.filter(isClosedCopyLog).slice(0, 12), [logs]);
  const pipelines = dashboard?.pipelines ?? [];
  const healthSummary = copierHealthSummary(pipelines, workerHealthy);
  const issueCount = pipelines.filter((p) => p.health === "error").length;
  const pnlTone = pnlClass(stats.dailyPnL);

  if (accounts.length === 0) return <ZeroState />;

  return (
    <div className="page-inner dash-page">
      <PageIntro
        className="dash-rise"
        description="Portfolio equity, copy health, and today's execution — refreshed every few seconds."
        actions={
          <span className="faint" style={{ fontSize: 12 }}>
            Updated {secondsAgo(lastUpdatedAt)}
          </span>
        }
      />

      <ConnectionBanner />
      <OnboardingChecklist />

      {issueCount > 0 && workerHealthy ? (
        <div className="dash-issues-banner dash-rise dash-section" style={{ marginBottom: 20 }}>
          <Icon name="alert" size={16} style={{ color: "var(--warning)", flex: "none", marginTop: 2 }} />
          <div className="grow">
            <strong>
              {issueCount} copy path{issueCount !== 1 ? "s" : ""} need attention
            </strong>
            <span className="faint" style={{ display: "block", marginTop: 4, fontSize: 12.5 }}>
              Service is online — check the latest event on each path below or open the copy log.
            </span>
          </div>
          <Link href="/logs" className="btn btn-ghost btn-sm">
            View copy log
          </Link>
        </div>
      ) : null}

      <div className="dash-stat-grid">
        <DashStat
          index={0}
          label="Accounts"
          value={stats.accountCount}
          sub={
            <span>
              {stats.connected} connected · {stats.accountCount - stats.connected} offline
            </span>
          }
        />
        <DashStat
          index={1}
          label="Portfolio value"
          value={fmtMoney(stats.portfolio)}
          sub={
            stats.equityOpen != null ? (
              <span>{fmtPctChange(stats.portfolio, stats.equityOpen)}</span>
            ) : (
              <span>Syncing start-of-day equity</span>
            )
          }
        />
        <DashStat
          index={2}
          label="Copies today"
          value={stats.copies}
          sub={
            <span>
              {stats.closed} closed · {stats.failed} failed / rejected
            </span>
          }
        />
        <DashStat
          index={3}
          label="Daily P&L"
          value={
            <span className={`dash-stat-value pnl-${pnlTone}`}>{fmtMoney(stats.dailyPnL)}</span>
          }
          sub={<span>Portfolio change since start of day</span>}
        />
      </div>

      <div
        className="card dash-panel dash-rise dash-copier-unified dash-section dash-section-gap"
        style={{ animationDelay: "280ms" }}
      >
        <div className="card-head">
          <Icon name="branch" size={16} style={{ color: "var(--accent)" }} />
          <h3>Copier</h3>
          <span
            className={`badge ${
              healthSummary.tone === "ok"
                ? "badge-ok"
                : healthSummary.tone === "warn"
                  ? "badge-warn"
                  : "badge-plain"
            }`}
          >
            {healthSummary.label}
          </span>
          <div className="grow" />
          {issueCount > 0 ? (
            <Link href="/logs" className="link-action" style={{ fontSize: 12, marginRight: 12 }}>
              View issues
            </Link>
          ) : null}
          <Link href="/copiers" className="link-action" style={{ fontSize: 12 }}>
            Open copy engine
          </Link>
        </div>

        <div className="dash-copier-body">
          <div className="dash-copier-pipelines">
            {pipelines.length === 0 ? (
              <EmptyHint icon="branch" title="No copy setups yet">
                <Link href="/copiers/new">Create your first master → follower link</Link>
              </EmptyHint>
            ) : (
              pipelines.slice(0, 4).map((p: DashboardPipeline) => {
                const m = accById(p.master_account_id);
                const f = accById(p.follower_account_id);
                const detail = pipelineDetail(p);
                return (
                  <Link
                    key={p.copier_id}
                    href={`/logs?copier=${p.copier_id}`}
                    className="dash-pipe-row"
                  >
                    <div className="row spread">
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{p.label}</span>
                      <span className={`badge ${healthBadgeClass(p.health)}`}>
                        {healthLabel(p.health)}
                      </span>
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
                    {detail ? <div className="dash-pipe-detail">{detail}</div> : null}
                  </Link>
                );
              })
            )}
          </div>

          <div className="dash-copier-metrics">
            <div className="dash-health-grid">
              <div className="dash-health-item">
                <span className="dash-health-label">Active followers</span>
                <span className="dash-health-val">{stats.activeSlaves}</span>
              </div>
              <div className="dash-health-item">
                <span className="dash-health-label">Masters linked</span>
                <span className="dash-health-val">{stats.mastersConnected}</span>
              </div>
              <div className="dash-health-item">
                <span className="dash-health-label">Copy success today</span>
                <span
                  className={`dash-health-val${stats.copySuccessRate == null ? " metric-empty" : ""}`}
                >
                  {stats.copySuccessRate != null ? `${stats.copySuccessRate.toFixed(0)}%` : "—"}
                </span>
              </div>
              <div className="dash-health-item">
                <span className="dash-health-label">Avg latency today</span>
                <span
                  className={`dash-health-val${stats.avgLatency == null ? " metric-empty" : ""}`}
                >
                  {stats.avgLatency != null ? fmtSpeedMs(stats.avgLatency) : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="card dash-panel dash-rise dash-logs dash-section"
        style={{ animationDelay: "360ms" }}
      >
        <div className="card-head">
          <Icon name="logs" size={16} />
          <h3>Recent copy log</h3>
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
                <th>Follower</th>
                <th>Symbol</th>
                <th>Side</th>
                <th>Latency</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="dash-empty-cell">
                    No copy events yet today
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
                      <td className="mono">{l.symbol !== "—" ? l.symbol : l.mapSymbol || "—"}</td>
                      <td className="capitalize">{l.side !== "—" ? l.side : "—"}</td>
                      <td className="mono">{fmtSpeedMs(l.latency)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card dash-panel dash-rise dash-acct dash-section" style={{ animationDelay: "440ms" }}>
        <div className="card-head">
          <Icon name="server" size={16} />
          <h3>Accounts & copy activity</h3>
        </div>
        <Tabs
          tabs={[
            { value: "accounts", label: "Accounts" },
            { value: "open", label: "Open copies" },
            { value: "closed", label: "Closed today" },
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
                  <div className="text-right">
                    <div className="mono">{fmtMoney(a.equity, a.currency ? `${a.currency} ` : "$")}</div>
                    {a.daily_equity_change != null ? (
                      <div
                        className="faint"
                        style={{
                          fontSize: 11,
                          color:
                            a.daily_equity_change >= 0 ? "var(--success)" : "var(--error)",
                        }}
                      >
                        {a.daily_equity_change >= 0 ? "+" : ""}
                        {fmtMoney(a.daily_equity_change, a.currency ? `${a.currency} ` : "$")} today
                      </div>
                    ) : null}
                  </div>
                  <StatusBadge status={connectionBadge(a.connection_status)} />
                </div>
              </Link>
            ))}
          {acctTab === "open" &&
            (openCopyLogs.length === 0 ? (
              <EmptyHint icon="activity" title="No open copies today">
                Successful copy opens from your execution log appear here — not live broker positions.
              </EmptyHint>
            ) : (
              openCopyLogs.map((l) => (
                <div key={l.id} className="dash-acct-row static">
                  <div>
                    <div className="mono" style={{ fontWeight: 600 }}>
                      {l.symbol !== "—" ? l.symbol : l.mapSymbol}
                    </div>
                    <div className="faint" style={{ fontSize: 11.5 }}>
                      {l.side} · {l.lotsExec || l.lotsReq} lots copied
                    </div>
                  </div>
                  <span className="faint mono">{fmtClock(l.t)}</span>
                </div>
              ))
            ))}
          {acctTab === "closed" &&
            (closedCopyLogs.length === 0 ? (
              <EmptyHint icon="logs" title="No closes today">
                Copy close events from today will appear here.
              </EmptyHint>
            ) : (
              closedCopyLogs.map((l) => (
                <div key={l.id} className="dash-acct-row static">
                  <div>
                    <div className="mono" style={{ fontWeight: 600 }}>
                      {l.symbol !== "—" ? l.symbol : l.mapSymbol}
                    </div>
                    <div className="faint" style={{ fontSize: 11.5 }}>
                      {l.side} · closed on follower
                    </div>
                  </div>
                  <span className="faint mono">{fmtClock(l.t)}</span>
                </div>
              ))
            ))}
        </div>
      </div>
    </div>
  );
}
