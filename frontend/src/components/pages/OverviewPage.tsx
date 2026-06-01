"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { ForensicDrawer } from "@/components/forensic/ForensicDrawer";
import {
  EmptyHint,
  KpiCard,
  LatencyCell,
  Seg,
  StatusBadge,
} from "@/components/ui";
import { useApp } from "@/components/shell/AppProvider";
import {
  accountDisplayName,
  connectionBadge,
  fmtClock,
  fmtInt,
  fmtMoney,
  latClass,
  platformLabel,
} from "@/lib/format";
import type { Account, LogRow } from "@/lib/types";

function useFlash(val: number) {
  const [f, setF] = useState(false);
  const prev = useRef(val);
  useEffect(() => {
    if (prev.current !== val) {
      setF(true);
      prev.current = val;
      const t = setTimeout(() => setF(false), 600);
      return () => clearTimeout(t);
    }
  }, [val]);
  return f;
}

function useLatencyHist(logs: LogRow[]) {
  const [hist, setHist] = useState(() =>
    logs.slice(0, 40).map((r) => r.latency).reverse(),
  );
  const lastId = useRef(logs[0]?.id);
  useEffect(() => {
    if (logs[0] && logs[0].id !== lastId.current) {
      lastId.current = logs[0].id;
      setHist((h) => [...h, logs[0].latency].slice(-40));
    }
  }, [logs]);
  return hist;
}

function Sparkline({ data, w = 240, h = 46 }: { data: number[]; w?: number; h?: number }) {
  if (!data.length) return null;
  const max = Math.max(600, ...data);
  const step = w / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => [
    i * step,
    h - (Math.min(v, 3000) / Math.max(max, 3000)) * h,
  ]);
  const dPath = pts
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${dPath} L ${w} ${h} L 0 ${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <path d={area} fill="var(--accent-tint)" opacity={0.6} />
      <path d={dPath} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
      {last && <circle cx={last[0]} cy={last[1]} r={2.5} fill="var(--accent)" />}
    </svg>
  );
}

function LatBars({ data, n = 32 }: { data: number[]; n?: number }) {
  const d = data.slice(-n);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 56 }}>
      {d.map((v, i) => {
        const c = latClass(v);
        const col =
          c === "g" ? "var(--accent)" : c === "a" ? "var(--warning)" : "var(--error)";
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: Math.max(4, (Math.min(v, 3000) / 3000) * 56),
              background: col,
              opacity: 0.35 + 0.65 * (i / d.length),
              borderRadius: 1,
            }}
          />
        );
      })}
    </div>
  );
}

function NodeCard({ a, onClick }: { a: Account; onClick: () => void }) {
  const name = accountDisplayName(a.account_label, a.account_number);
  return (
    <div className="card" style={{ padding: 14, cursor: "pointer" }} onClick={onClick}>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
          <div className="faint" style={{ fontSize: 11.5 }}>
            {a.broker_server} ·{" "}
            <span className="badge badge-plain">{platformLabel(a.platform)}</span>
          </div>
        </div>
        <StatusBadge status={connectionBadge(a.connection_status)} />
      </div>
      <div className="row" style={{ gap: 0 }}>
        <div style={{ flex: 1, borderRight: "1px solid var(--border)" }}>
          <div
            className="faint"
            style={{
              fontSize: 10.5,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 2,
            }}
          >
            Balance
          </div>
          <div className="mono" style={{ fontWeight: 600, fontSize: 14 }}>
            {fmtMoney(a.balance, a.currency ? `${a.currency} ` : "$")}
          </div>
        </div>
        <div style={{ flex: 1, paddingLeft: 14 }}>
          <div
            className="faint"
            style={{
              fontSize: 10.5,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 2,
            }}
          >
            Equity
          </div>
          <div
            className="mono"
            style={{
              fontWeight: 600,
              fontSize: 14,
              color:
                (a.equity ?? 0) >= (a.balance ?? 0) ? "var(--success)" : "var(--error)",
            }}
          >
            {fmtMoney(a.equity, a.currency ? `${a.currency} ` : "$")}
          </div>
        </div>
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
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--panel)",
            color: "var(--accent)",
          }}
        >
          <Icon name="zap" size={24} />
        </div>
        <h1 style={{ margin: "0 0 6px", fontSize: 22 }}>No active connections yet</h1>
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
          Set up the copy engine in three steps. It takes about two minutes.
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            n: 1,
            t: "Link broker node",
            d: "Connect your first MT5 terminal with encrypted credentials.",
            icon: "server" as const,
          },
          {
            n: 2,
            t: "Map copy-path routing",
            d: "Define a master → follower pipeline with allocation rules.",
            icon: "branch" as const,
          },
          {
            n: 3,
            t: "Monitor the audit ledger",
            d: "Watch every replicated signal stream through in real time.",
            icon: "logs" as const,
          },
        ].map((s) => (
          <div key={s.n} className="card card-pad" style={{ textAlign: "left" }}>
            <div className="row spread" style={{ marginBottom: 12 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 3,
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
                style={{ fontSize: 22, fontWeight: 600, color: "var(--border-strong)" }}
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
          Link First Trading Account
        </Link>
      </div>
    </div>
  );
}

function SignalsLedger({
  rows,
  onRow,
}: {
  rows: LogRow[];
  onRow: (r: LogRow) => void;
}) {
  return (
    <table className="tbl">
      <thead>
        <tr>
          {["Time", "Status", "Event", "Symbol", "Latency"].map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr
            key={r.id}
            className={i === 0 ? "flash" : ""}
            onClick={() => onRow(r)}
            style={{ cursor: "pointer" }}
          >
            <td className="num t-time">{fmtClock(r.t)}</td>
            <td>
              <StatusBadge status={r.status} />
            </td>
            <td>{r.eventType}</td>
            <td>
              <span className="row gap8">
                <span className="mono" style={{ fontWeight: 600 }}>
                  {r.symbol}
                </span>
                <span className={`pill ${r.side === "Buy" ? "pill-buy" : "pill-sell"}`}>
                  {r.side}
                </span>
              </span>
            </td>
            <td>
              <LatencyCell ms={r.latency} bar />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function OverviewPage() {
  const { accounts, copiers, logs, logsTotal } = useApp();
  const [variant, setVariant] = useState("A");
  const [drawerRow, setDrawerRow] = useState<LogRow | null>(null);
  const hist = useLatencyHist(logs);

  const connected = accounts.filter((a) => a.connection_status === "connected").length;
  const activePaths = copiers.filter((c) => c.is_enabled).length;
  const avgLatency =
    logs.length > 0
      ? logs.slice(0, 20).reduce((s, r) => s + r.latency, 0) / Math.min(20, logs.length)
      : 0;
  const evFlash = useFlash(logsTotal);
  const latFlash = useFlash(Math.round(avgLatency));

  useEffect(() => {
    const v = localStorage.getItem("de_ov_variant");
    if (v) setVariant(v);
  }, []);

  const setV = (v: string) => {
    setVariant(v);
    localStorage.setItem("de_ov_variant", v);
  };

  if (accounts.length === 0) return <ZeroState />;

  const recent = logs.slice(0, variant === "A" ? 6 : 8);

  const ribbon = (
    <div className="kpi-grid">
      <KpiCard
        icon="server"
        label="Accounts Monitored"
        value={
          <span>
            {connected} / {accounts.length}
          </span>
        }
        sub={`${accounts.filter((a) => a.connection_status !== "connected").length} not connected`}
        subIcon="wifi"
        edge="accent"
      />
      <KpiCard
        icon="branch"
        label="Active Core Paths"
        value={activePaths}
        sub={`${copiers.length} configured links`}
        subIcon="link"
      />
      <KpiCard
        icon="activity"
        label="Execution Events"
        value={fmtInt(logsTotal)}
        sub="in audit ledger"
        subIcon="zap"
        flash={evFlash}
        edge="pulse"
      />
      <KpiCard
        icon="gauge"
        label="Avg Latency"
        value={avgLatency.toFixed(1)}
        unit="ms"
        sub="recent samples"
        subIcon="clock"
        flash={latFlash}
      />
    </div>
  );

  const ledgerCard = (max: number) => (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="card-head">
        <Icon name="activity" size={16} style={{ color: "var(--accent)" }} />
        <h3>Recent Signals Ledger</h3>
        <span className="sub">· live</span>
        <div className="grow" />
        <span className="watchdog" style={{ padding: "3px 9px", fontSize: 11 }}>
          <span className="dot" />
          streaming
        </span>
      </div>
      {recent.length === 0 ? (
        <EmptyHint icon="logs" title="No events yet">
          Deploy a copier and place a trade to see signals here.
        </EmptyHint>
      ) : (
        <SignalsLedger rows={recent.slice(0, max)} onRow={setDrawerRow} />
      )}
      <div className="card-foot">
        <Link href="/logs" className="link-action">
          View Full Forensic Logs
          <Icon name="arrowRight" size={14} />
        </Link>
      </div>
    </div>
  );

  const nodePane = (
    <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="card-head">
        <Icon name="server" size={16} style={{ color: "var(--accent)" }} />
        <h3>Server Node Diagnostics</h3>
      </div>
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {accounts.map((a) => (
          <Link key={a.id} href={`/accounts/${a.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <NodeCard a={a} onClick={() => {}} />
          </Link>
        ))}
      </div>
      <div className="card-foot">
        <Link href="/accounts" className="link-action">
          Manage Accounts
          <Icon name="arrowRight" size={14} />
        </Link>
      </div>
    </div>
  );

  let body;
  if (variant === "A") {
    body = (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 16,
          marginTop: 16,
          alignItems: "start",
        }}
      >
        {ledgerCard(6)}
        {nodePane}
      </div>
    );
  } else if (variant === "B") {
    body = (
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${accounts.length}, 1fr) 0.9fr`,
            gap: 12,
          }}
        >
          {accounts.map((a) => (
            <Link
              key={a.id}
              href={`/accounts/${a.id}`}
              className="card"
              style={{ padding: "12px 14px", textDecoration: "none", color: "inherit" }}
            >
              <div className="row spread" style={{ marginBottom: 7 }}>
                <span style={{ fontWeight: 600, fontSize: 12.5 }}>
                  {accountDisplayName(a.account_label, a.account_number).split(" — ")[0]}
                </span>
                <StatusBadge status={connectionBadge(a.connection_status)} />
              </div>
              <div className="row spread mono" style={{ fontSize: 12 }}>
                <span className="faint">{a.broker_server}</span>
                <span style={{ fontWeight: 600 }}>{fmtMoney(a.equity)}</span>
              </div>
            </Link>
          ))}
          <div
            className="card"
            style={{ padding: "10px 14px", display: "flex", flexDirection: "column", justifyContent: "center" }}
          >
            <div className="row spread" style={{ marginBottom: 4 }}>
              <span
                className="faint"
                style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                Latency avg
              </span>
              <span className="mono" style={{ fontWeight: 600, fontSize: 13, color: "var(--accent)" }}>
                {avgLatency.toFixed(0)}ms
              </span>
            </div>
            <LatBars data={hist} n={22} />
          </div>
        </div>
        {ledgerCard(8)}
      </div>
    );
  } else {
    body = (
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
          <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="row spread">
              <div>
                <div
                  className="faint"
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 600,
                  }}
                >
                  Engine Throughput
                </div>
                <div className="row gap8" style={{ alignItems: "baseline", marginTop: 4 }}>
                  <span
                    className="mono"
                    style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em" }}
                  >
                    {avgLatency.toFixed(1)}
                  </span>
                  <span className="faint" style={{ fontSize: 14 }}>
                    ms round-trip
                  </span>
                </div>
              </div>
              <span className="badge badge-accent">
                <span className="bdot" />
                nominal
              </span>
            </div>
            <Sparkline data={hist} />
          </div>
          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 16 }}>
            <KpiCard
              icon="activity"
              label="Execution Events"
              value={fmtInt(logsTotal)}
              sub="in audit ledger"
              subIcon="zap"
              flash={evFlash}
              edge="pulse"
            />
            <KpiCard
              icon="branch"
              label="Active Core Paths"
              value={activePaths}
              sub={`${connected} / ${accounts.length} nodes connected`}
              subIcon="server"
              edge="accent"
            />
          </div>
        </div>
        {ledgerCard(8)}
      </div>
    );
  }

  return (
    <div className="page-inner">
      <div className="page-head">
        <div className="pt">
          <h1>Command Control</h1>
          <p className="desc">
            Live operational overview of every linked terminal and copy pipeline.
          </p>
        </div>
        <div className="actions row gap12">
          <div className="row gap8">
            <span className="faint" style={{ fontSize: 11, fontWeight: 600 }}>
              LAYOUT
            </span>
            <Seg
              options={[
                { value: "A", label: "Split" },
                { value: "B", label: "Rail" },
                { value: "C", label: "Telemetry" },
              ]}
              value={variant}
              onChange={setV}
            />
          </div>
          <Link href="/copiers/new" className="btn btn-dark">
            <Icon name="plus" size={15} />
            New Copier
          </Link>
        </div>
      </div>
      {variant !== "C" && ribbon}
      {body}
      {drawerRow && (
        <ForensicDrawer row={drawerRow} onClose={() => setDrawerRow(null)} />
      )}
    </div>
  );
}
