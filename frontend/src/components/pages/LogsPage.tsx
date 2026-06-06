"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { ForensicDrawer } from "@/components/forensic/ForensicDrawer";
import { EmptyHint, Seg, StatusBadge, TimingCell } from "@/components/ui";
import { useApp } from "@/components/shell/AppProvider";
import { accountDisplayName, fmtClock, fmtInt } from "@/lib/format";
import type { LogRow } from "@/lib/types";

const STATUSES = [
  { v: "executed", l: "Executed" },
  { v: "pending", l: "Pending" },
  { v: "skipped", l: "Skipped" },
  { v: "failed", l: "Failed" },
];

const RANGES = [
  { v: "24h", l: "24 Hours" },
  { v: "7d", l: "7 Days" },
  { v: "30d", l: "30 Days" },
];

function LedgerRows({
  rows,
  onRow,
  selId,
}: {
  rows: LogRow[];
  onRow: (r: LogRow) => void;
  selId?: string;
}) {
  const { cpById } = useApp();
  const rowH = 40;
  const over = 10;
  const ref = useRef<HTMLDivElement>(null);
  const [st, setSt] = useState(0);
  const [vh, setVh] = useState(640);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const upd = () => setVh(el.clientHeight);
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const start = Math.max(0, Math.floor(st / rowH) - over);
  const end = Math.min(rows.length, Math.ceil((st + vh) / rowH) + over);
  const slice = rows.slice(start, end);

  return (
    <div className="lg-scroll" ref={ref} onScroll={(e) => setSt(e.currentTarget.scrollTop)}>
      <div className="lg-content">
        <div className="lg-head">
          <div className="lg-row">
            {[
              "Time",
              "Status",
              "What happened",
              "Setup",
              "Master",
              "Your account",
              "Symbol",
              "Side",
              "Size",
              "Speed",
            ].map((h) => (
              <div key={h}>{h}</div>
            ))}
          </div>
        </div>
        <div className="lg-body" style={{ position: "relative" }}>
          <div style={{ height: start * rowH }} />
          {slice.map((r) => {
            const cp = cpById(r.copierId);
            const exClass =
              r.lotsExec === 0 ? "ex-zero" : r.lotsExec < r.lotsReq ? "ex-bad" : "";
            return (
              <div
                key={r.id}
                className={`lg-row${selId === r.id ? " sel" : ""}`}
                onClick={() => onRow(r)}
              >
                <div className="mono t-time">{fmtClock(r.t)}</div>
                <div>
                  <StatusBadge status={r.status} />
                </div>
                <div>{r.eventType}</div>
                <div style={{ fontWeight: 500 }}>{cp?.label ?? "—"}</div>
                <div className="mono">#{r.masterTicket}</div>
                <div className="mono faint">
                  {r.followerTicket ? `#${r.followerTicket}` : "—"}
                </div>
                <div>
                  <span className="sym-map">
                    {r.symbol}
                    {r.mapSymbol !== r.symbol && (
                      <>
                        <Icon name="arrowRight" size={11} className="arr" />
                        {r.mapSymbol}
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <span className={`pill ${r.side === "Buy" ? "pill-buy" : "pill-sell"}`}>
                    {r.side}
                  </span>
                </div>
                <div className="lots-cell">
                  {r.lotsReq.toFixed(2)}{" "}
                  <span className={exClass}>/ {r.lotsExec.toFixed(2)}</span>
                </div>
                <div>
                  <TimingCell
                    e2eMs={r.e2eMs ?? r.latency}
                    orderMs={r.orderMs}
                    switchMs={r.switchMs}
                  />
                </div>
              </div>
            );
          })}
          <div style={{ height: (rows.length - end) * rowH }} />
        </div>
      </div>
    </div>
  );
}

function MobileLogList({
  rows,
  onRow,
  selId,
}: {
  rows: LogRow[];
  onRow: (r: LogRow) => void;
  selId?: string;
}) {
  const { cpById } = useApp();

  return (
    <div className="log-mobile-list show-mobile-only">
      {rows.length === 0 ? (
        <p className="faint" style={{ padding: "8px 4px", fontSize: 13 }}>
          No entries match your filters.
        </p>
      ) : (
        rows.map((r) => {
          const cp = cpById(r.copierId);
          return (
            <button
              key={r.id}
              type="button"
              className={`log-mobile-card${selId === r.id ? " sel" : ""}`}
              onClick={() => onRow(r)}
            >
              <div className="row spread" style={{ marginBottom: 6 }}>
                <StatusBadge status={r.status} />
                <span className="mono faint" style={{ fontSize: 11 }}>
                  {fmtClock(r.t)}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{r.eventType}</div>
              <div className="faint" style={{ fontSize: 12, marginBottom: 6 }}>
                {cp?.label ?? "Setup"} · {r.symbol}
                {r.side ? ` · ${r.side}` : ""}
              </div>
              <div className="row spread" style={{ fontSize: 12 }}>
                <span className="mono">{r.lotsExec.toFixed(2)} lots</span>
                <TimingCell
                  e2eMs={r.e2eMs ?? r.latency}
                  orderMs={r.orderMs}
                  switchMs={r.switchMs}
                />
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}

export default function LogsPage() {
  const { accounts, logs, logsTotal, cpById } = useApp();
  const [range, setRange] = useState("24h");
  const [statusSel, setStatusSel] = useState(() => new Set(STATUSES.map((s) => s.v)));
  const [sym, setSym] = useState("");
  const [master, setMaster] = useState("all");
  const [sel, setSel] = useState<LogRow | null>(null);

  const filtered = useMemo(() => {
    const cutoff =
      range === "24h"
        ? Date.now() - 86400000
        : range === "7d"
          ? Date.now() - 7 * 86400000
          : Date.now() - 30 * 86400000;
    return logs.filter((r) => {
      if (r.t.getTime() < cutoff) return false;
      if (!statusSel.has(r.status)) return false;
      if (sym && !r.symbol.toLowerCase().includes(sym.toLowerCase())) return false;
      if (master !== "all") {
        const cp = cpById(r.copierId);
        if (!cp || cp.master_account_id !== master) return false;
      }
      return true;
    });
  }, [logs, statusSel, sym, master, range, cpById]);

  const toggleStatus = (v: string) =>
    setStatusSel((s) => {
      const n = new Set(s);
      if (n.has(v)) n.delete(v);
      else n.add(v);
      return n;
    });

  return (
    <div className="logs-page-root" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="logs-page-head" style={{ padding: "20px 22px 0", flex: "none" }}>
        <div className="page-head" style={{ marginBottom: 14 }}>
          <div className="pt">
            <h1>Copy log</h1>
            <p className="desc">
              A running list of trades copied to your accounts. Tap a row for full details.
            </p>
          </div>
          <div className="actions">
            <span className="badge badge-plain" style={{ fontSize: 12 }}>
              {fmtInt(filtered.length)} / {fmtInt(logsTotal)} rows
            </span>
          </div>
        </div>
      </div>
      <div className="lg-toolbar">
        <Seg
          options={RANGES.map((r) => ({ value: r.v, label: r.l }))}
          value={range}
          onChange={setRange}
        />
        <div style={{ width: 1, height: 24, background: "var(--border)" }} />
        <div className="row gap6">
          {STATUSES.map((s) => (
            <button
              key={s.v}
              type="button"
              className={`chk${statusSel.has(s.v) ? " on" : ""}`}
              onClick={() => toggleStatus(s.v)}
              style={{
                padding: "4px 9px",
                border: "1px solid var(--border)",
                borderRadius: 2,
                background: statusSel.has(s.v) ? "var(--panel)" : "var(--canvas)",
              }}
            >
              <span className="box">
                {statusSel.has(s.v) && <Icon name="check" size={11} />}
              </span>
              {s.l}
            </button>
          ))}
        </div>
        <div className="grow" />
        <div className="inp-wrap" style={{ width: 180 }}>
          <input
            className="inp mono"
            placeholder="Filter symbol…"
            value={sym}
            onChange={(e) => setSym(e.target.value)}
            style={{ paddingLeft: 30 }}
          />
          <Icon
            name="search"
            size={14}
            style={{ position: "absolute", left: 9, top: 11, color: "var(--faint)" }}
          />
        </div>
        <select
          className="sel"
          style={{ width: 200 }}
          value={master}
          onChange={(e) => setMaster(e.target.value)}
        >
          <option value="all">All master accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {accountDisplayName(a.account_label, a.account_number)}
            </option>
          ))}
        </select>
      </div>
      {accounts.length === 0 ? (
        <EmptyHint icon="logs" title="No activity yet">
          Link accounts and turn on a copier to see copy events here.
        </EmptyHint>
      ) : (
        <>
          <div className="lg-desktop-only lg-scroll-wrap">
            <LedgerRows rows={filtered} onRow={setSel} selId={sel?.id} />
          </div>
          <MobileLogList rows={filtered} onRow={setSel} selId={sel?.id} />
        </>
      )}
      {sel && <ForensicDrawer row={sel} onClose={() => setSel(null)} />}
    </div>
  );
}
