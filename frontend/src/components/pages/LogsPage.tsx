"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageIntro } from "@/components/shell/PageIntro";
import { Icon } from "@/components/icons/Icon";
import { ForensicDrawer } from "@/components/forensic/ForensicDrawer";
import { EmptyHint, Seg, StatusBadge, TimingCell } from "@/components/ui";
import { useApp, useAccessToken } from "@/components/shell/AppProvider";
import { accountDisplayName, executionEventToLogRow, fmtClock, fmtInt } from "@/lib/format";
import * as api from "@/lib/data";
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

const LOGS_POLL_MS = 5_000;
const LOGS_FETCH_LIMIT = 300;

function rangeToDateFrom(range: string): string {
  const ms =
    range === "24h"
      ? 86400000
      : range === "7d"
        ? 7 * 86400000
        : 30 * 86400000;
  return new Date(Date.now() - ms).toISOString();
}

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
    <div className="log-mobile-scroll show-mobile-only">
      <div className="log-mobile-list">
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
    </div>
  );
}

export default function LogsPage() {
  const { accounts, paused, cpById } = useApp();
  const getToken = useAccessToken();
  const searchParams = useSearchParams();
  const copierFilter = searchParams.get("copier") ?? "all";

  const [range, setRange] = useState("24h");
  const [statusSel, setStatusSel] = useState(() => new Set(STATUSES.map((s) => s.v)));
  const [sym, setSym] = useState("");
  const [symDebounced, setSymDebounced] = useState("");
  const [master, setMaster] = useState("all");
  const [sel, setSel] = useState<LogRow | null>(null);
  const [rows, setRows] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setSymDebounced(sym.trim()), 300);
    return () => clearTimeout(t);
  }, [sym]);

  const statusGroupsParam = useMemo(() => {
    const groups = STATUSES.filter((s) => statusSel.has(s.v)).map((s) => s.v);
    return groups.length === STATUSES.length ? undefined : groups.join(",");
  }, [statusSel]);

  const loadLogs = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const token = await getToken();
      if (!token) return;
      const res = await api.fetchExecutionEvents(token, {
        limit: LOGS_FETCH_LIMIT,
        date_from: rangeToDateFrom(range),
        copier_relation_id: copierFilter !== "all" ? copierFilter : undefined,
        master_account_id: master !== "all" ? master : undefined,
        status_groups: statusGroupsParam,
        symbol: symDebounced ? symDebounced.toUpperCase() : undefined,
      });
      setRows(res.events.map(executionEventToLogRow));
      setTotal(res.total);
      setLastUpdatedAt(new Date());
    } catch {
      /* keep last good data */
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [getToken, range, copierFilter, master, statusGroupsParam, symDebounced]);

  useEffect(() => {
    setLoading(true);
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (paused) return;
    const onVis = () => {
      if (document.visibilityState === "visible") loadLogs();
    };
    document.addEventListener("visibilitychange", onVis);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadLogs();
    }, LOGS_POLL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(id);
    };
  }, [paused, loadLogs]);

  const toggleStatus = (v: string) =>
    setStatusSel((s) => {
      const n = new Set(s);
      if (n.has(v)) n.delete(v);
      else n.add(v);
      return n;
    });

  const secondsAgo = (d: Date | null) => {
    if (!d) return "—";
    const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  };

  const copierLabel =
    copierFilter !== "all" ? cpById(copierFilter)?.label : null;

  return (
    <div className="logs-page-root">
      <div className="logs-page-head">
        <PageIntro
          style={{ marginBottom: 14 }}
          description={
            copierLabel
              ? `Filtered to setup “${copierLabel}”. Tap a row for full timing and broker details.`
              : "A running list of trades copied to your accounts. Tap a row for full details."
          }
          actions={
            <div className="row gap8">
              <span className="faint" style={{ fontSize: 12 }}>
                Updated {secondsAgo(lastUpdatedAt)}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => loadLogs()}
                disabled={loading}
              >
                <Icon name="refresh" size={14} />
                Refresh
              </button>
              <span className="badge badge-plain" style={{ fontSize: 12 }}>
                {fmtInt(rows.length)} shown · {fmtInt(total)} in range
              </span>
            </div>
          }
        />
      </div>
      <div className="lg-toolbar">
        <Seg
          options={RANGES.map((r) => ({ value: r.v, label: r.l }))}
          value={range}
          onChange={setRange}
        />
        <div className="lg-toolbar-divider" />
        <div className="row gap6">
          {STATUSES.map((s) => (
            <button
              key={s.v}
              type="button"
              className={`chk${statusSel.has(s.v) ? " on" : ""}`}
              onClick={() => toggleStatus(s.v)}
            >
              <span className="box">
                {statusSel.has(s.v) && <Icon name="check" size={11} />}
              </span>
              {s.l}
            </button>
          ))}
        </div>
        <div className="grow" />
        <div className="inp-wrap lg-filter-symbol">
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
          className="sel lg-filter-master"
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
      {loading && rows.length === 0 ? (
        <div className="logs-loading faint">Loading copy events…</div>
      ) : rows.length === 0 && accounts.length === 0 ? (
        <EmptyHint icon="logs" title="No activity yet">
          Link accounts and turn on a copier to see copy events here.
        </EmptyHint>
      ) : rows.length === 0 ? (
        <EmptyHint icon="logs" title="No events in this range">
          Try widening the time range or clearing filters.
        </EmptyHint>
      ) : (
        <>
          <div className="lg-desktop-only lg-scroll-wrap">
            <LedgerRows rows={rows} onRow={setSel} selId={sel?.id} />
          </div>
          <MobileLogList rows={rows} onRow={setSel} selId={sel?.id} />
        </>
      )}
      {sel && <ForensicDrawer row={sel} onClose={() => setSel(null)} />}
    </div>
  );
}
