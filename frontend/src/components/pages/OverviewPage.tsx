"use client";

import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { EmptyHint, KpiCard, StatusBadge } from "@/components/ui";
import { useApp } from "@/components/shell/AppProvider";
import {
  accountDisplayName,
  connectionBadge,
  fmtClock,
  fmtMoney,
  fmtSpeedMs,
} from "@/lib/format";
import { PlatformBadge } from "@/components/PlatformIcon";
import type { DashboardPipeline, PipelineHealth } from "@/lib/types";

function secondsAgo(d: Date | null) {
  if (!d) return "—";
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
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

function healthBadge(h: PipelineHealth) {
  const map: Record<PipelineHealth, string> = {
    active: "ok",
    idle: "muted",
    paused: "muted",
    error: "crit",
    worker_offline: "warn",
  };
  return map[h] ?? "muted";
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
    <div className="card card-pad" style={{ marginBottom: 16 }}>
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
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      border: "1.5px solid currentColor",
                    }}
                  />
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
    <div className="alert-banner warn">
      <Icon name="alert" size={16} />
      <span>
        {disconnected} account{disconnected !== 1 ? "s aren't" : " isn't"} connected — copying may not work until you reconnect.
      </span>
      <Link href="/accounts" className="alert-link">
        Fix connections
      </Link>
    </div>
  );
}

function PortfolioHero() {
  const { dashboard, workerHealthy } = useApp();
  const today = dashboard?.today;
  const total = today?.total_equity;
  const change = today?.net_equity_change;
  const changeClass =
    change == null ? "flat" : change > 0 ? "up" : change < 0 ? "down" : "flat";

  return (
    <div className="card portfolio-hero">
      <div>
        <div className="ph-label">Portfolio value</div>
        <div className="ph-value">
          {total != null ? fmtMoney(total) : "Syncing…"}
        </div>
        <div className={`ph-change ${changeClass}`}>
          {change != null ? (
            <>
              {change >= 0 ? "+" : ""}
              {fmtMoney(change)} today
            </>
          ) : (
            "Today's change loading…"
          )}
        </div>
      </div>
      <div className="row gap10" style={{ flexWrap: "wrap" }}>
        <Link href="/copiers" className="btn btn-accent">
          <Icon name="branch" size={15} />
          Copy engine
        </Link>
        <Link href="/copiers/new" className="btn btn-ghost">
          <Icon name="plus" size={15} />
          Add setup
        </Link>
        {!workerHealthy && (
          <span className="badge badge-warn">Copy service offline</span>
        )}
      </div>
    </div>
  );
}

function PipelineCard({
  pipe,
  masterName,
  followerName,
}: {
  pipe: DashboardPipeline;
  masterName: string;
  followerName: string;
}) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{pipe.label}</div>
        <span className={`badge badge-${healthBadge(pipe.health)}`}>
          {healthLabel(pipe.health)}
        </span>
      </div>
      <div className="row gap8" style={{ fontSize: 12.5, marginBottom: 10, flexWrap: "wrap" }}>
        <span className="badge badge-plain">{masterName}</span>
        <Icon name="arrowRight" size={14} style={{ color: "var(--faint)" }} />
        <span className="badge badge-plain">{followerName}</span>
        <span className="faint">· {pipe.allocation}</span>
      </div>
      {pipe.last_symbol ? (
        <div className="faint" style={{ fontSize: 12 }}>
          Last: {pipe.last_symbol}
          {pipe.last_event_at ? ` · ${fmtClock(new Date(pipe.last_event_at))}` : ""}
        </div>
      ) : (
        <div className="faint" style={{ fontSize: 12 }}>
          No copies yet today
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        <Link href={`/copiers/${pipe.copier_id}`} className="link-action" style={{ fontSize: 12 }}>
          Manage setup
          <Icon name="chevronRight" size={13} />
        </Link>
      </div>
    </div>
  );
}

function ZeroState() {
  return (
    <div className="page-inner" style={{ maxWidth: 880 }}>
      <div style={{ textAlign: "center", padding: "8px 0 26px" }}>
        <div
          style={{
            width: 52,
            height: 52,
            margin: "0 auto 16px",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--panel)",
            color: "var(--accent)",
          }}
        >
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
          <div key={s.n} className="card card-pad" style={{ textAlign: "left" }}>
            <div className="row spread" style={{ marginBottom: 12 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "var(--r-button)",
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent)",
                }}
              >
                <Icon name={s.icon} size={17} />
              </div>
              <span
                className="mono"
                style={{ fontSize: 22, fontWeight: 600, color: "var(--text-quaternary)" }}
              >
                0{s.n}
              </span>
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
  const { accounts, dashboard, accById, lastUpdatedAt, workerHealthy } = useApp();

  if (accounts.length === 0) return <ZeroState />;

  const today = dashboard?.today;
  const pipelines = dashboard?.pipelines ?? [];
  const activity = dashboard?.recent_activity ?? [];

  return (
    <div className="page-inner">
      <div className="page-head">
        <div className="pt">
          <h1>Home</h1>
          <p className="desc">
            Your money, copy setups, and what happened today — at a glance.
          </p>
        </div>
        <div className="actions row gap12">
          <span className="faint" style={{ fontSize: 12 }}>
            Updated {secondsAgo(lastUpdatedAt)}
          </span>
        </div>
      </div>

      <PortfolioHero />
      <ConnectionBanner />
      <OnboardingChecklist />

      <div className="kpi-grid" style={{ marginTop: 16 }}>
        <KpiCard
          icon="gauge"
          label="Today's change"
          value={
            today?.net_equity_change != null
              ? `${today.net_equity_change >= 0 ? "+" : ""}${fmtMoney(today.net_equity_change)}`
              : "—"
          }
          sub={
            today?.total_equity != null
              ? `Portfolio ${fmtMoney(today.total_equity)}`
              : "Syncing balances…"
          }
          subIcon="server"
          edge="accent"
        />
        <KpiCard
          icon="activity"
          label="Copies today"
          value={today?.copies ?? 0}
          sub={`${today?.closed ?? 0} closed · ${today?.failed ?? 0} failed`}
          subIcon="zap"
          edge="pulse"
        />
        <KpiCard
          icon="branch"
          label="Active setups"
          value={dashboard?.active_copiers ?? 0}
          sub={`${pipelines.length} total · open copy engine`}
          subIcon="link"
        />
        <KpiCard
          icon="server"
          label="Connected"
          value={
            <span>
              {dashboard?.connected_accounts ?? 0} / {accounts.length}
            </span>
          }
          sub={workerHealthy ? "All services ready" : "Copy service offline"}
          subIcon="wifi"
          edge={workerHealthy ? undefined : "accent"}
        />
      </div>

      <div className="grid-home-two-col">
        <div>
          <div className="row spread" style={{ marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Copy setups</h2>
            <Link href="/copiers" className="link-action" style={{ fontSize: 12 }}>
              Open copy engine
            </Link>
          </div>
          {pipelines.length === 0 ? (
            <div className="card">
              <EmptyHint icon="branch" title="No copy setups yet">
                <Link href="/copiers/new">Create your first master → follower link</Link>
              </EmptyHint>
            </div>
          ) : (
            <div className="grid-home-pipelines">
              {pipelines.map((p) => {
                const m = accById(p.master_account_id);
                const f = accById(p.follower_account_id);
                return (
                  <PipelineCard
                    key={p.copier_id}
                    pipe={p}
                    masterName={
                      m
                        ? accountDisplayName(m.account_label, m.account_number).split(" — ")[0]
                        : "Master"
                    }
                    followerName={
                      f
                        ? accountDisplayName(f.account_label, f.account_number).split(" — ")[0]
                        : "Follower"
                    }
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-head">
            <Icon name="activity" size={16} style={{ color: "var(--accent)" }} />
            <h3>Recent copies</h3>
            <span className="sub">· today</span>
          </div>
          {activity.length === 0 ? (
            <EmptyHint icon="logs" title="No activity yet">
              Place a trade on your master to see copies here.
            </EmptyHint>
          ) : (
            <div style={{ padding: "4px 0" }}>
              {activity.slice(0, 8).map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 12.5,
                  }}
                >
                  <div className="row spread" style={{ marginBottom: 3 }}>
                    <span style={{ fontWeight: 500 }}>{a.message}</span>
                    <span className="faint mono" style={{ fontSize: 11 }}>
                      {fmtClock(new Date(a.at))}
                    </span>
                  </div>
                  {a.latency_ms != null && (
                    <span className="faint" style={{ fontSize: 11 }}>
                      Copied in {fmtSpeedMs(a.latency_ms)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="card-foot">
            <Link href="/logs" className="link-action">
              Open copy log
              <Icon name="arrowRight" size={14} />
            </Link>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div className="row spread" style={{ marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Account balances</h2>
          <Link href="/accounts" className="link-action" style={{ fontSize: 12 }}>
            Manage accounts
          </Link>
        </div>
        <div className="grid-home-accounts">
          {(dashboard?.accounts ?? []).map((a) => (
            <Link
              key={a.id}
              href={`/accounts/${a.id}`}
              className="card"
              style={{ padding: 14, textDecoration: "none", color: "inherit" }}
            >
              <div className="row spread" style={{ marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.label}</div>
                  <div className="faint row gap6" style={{ fontSize: 11.5, marginTop: 2 }}>
                    <PlatformBadge platformId={a.platform} size="md" />
                    <span className="capitalize">{a.role}</span>
                  </div>
                </div>
                <StatusBadge status={connectionBadge(a.connection_status)} />
              </div>
              <div className="row spread mono" style={{ fontSize: 13 }}>
                <span>{fmtMoney(a.equity, a.currency ? `${a.currency} ` : "$")}</span>
                {a.daily_equity_change != null && (
                  <span
                    style={{
                      color:
                        a.daily_equity_change >= 0 ? "var(--success)" : "var(--error)",
                      fontSize: 12,
                    }}
                  >
                    {a.daily_equity_change >= 0 ? "+" : ""}
                    {fmtMoney(a.daily_equity_change)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
