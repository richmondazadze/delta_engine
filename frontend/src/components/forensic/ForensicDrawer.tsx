"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { LatencyCell, StatusBadge } from "@/components/ui";
import { fmtClock } from "@/lib/format";
import type { Copier, LogRow } from "@/lib/types";
import { useApp } from "@/components/shell/AppProvider";

export function ForensicDrawer({
  row,
  onClose,
}: {
  row: LogRow;
  onClose: () => void;
}) {
  const { cpById, accById } = useApp();
  const [jsonOpen, setJsonOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cp = cpById(row.copierId);
  const master = cp ? accById(cp.master_account_id) : undefined;
  const follower = cp ? accById(cp.follower_account_id) : undefined;
  const payload = row.raw.raw_payload ?? {
    event_id: row.id,
    ts: row.t.toISOString(),
    status: row.status,
    code: row.code,
    copier: row.copierId,
    master_ticket: row.masterTicket,
    follower_ticket: row.followerTicket,
    symbol: row.symbol,
    mapped_symbol: row.mapSymbol,
    side: row.side,
    lots: { requested: row.lotsReq, executed: row.lotsExec },
    latency_ms: row.latency,
    pricing: {
      entry: row.entryPrice,
      fill: row.fillPrice,
      slippage_pips: row.slippagePips,
    },
  };
  const jsonStr = JSON.stringify(payload, null, 2);
  const copy = () => {
    try {
      navigator.clipboard.writeText(jsonStr);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const stale = row.status === "skipped";
  const failed = row.status === "failed";

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="row gap8" style={{ marginBottom: 3 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Event Audit Breakdown</span>
              <StatusBadge status={row.status} />
            </div>
            <div className="mono faint" style={{ fontSize: 11.5 }}>
              {fmtClock(row.t)} · {row.t.toLocaleDateString()}
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="drawer-body">
          <div className="dz-section">
            <h4>Core Transaction Identification</h4>
            <dl className="kv">
              <dt>Copier Link</dt>
              <dd>{cp?.label ?? "—"}</dd>
              <dt>Master Ticket</dt>
              <dd className="mono">#{row.masterTicket}</dd>
              <dt>Follower Ticket</dt>
              <dd className="mono">{row.followerTicket ? `#${row.followerTicket}` : "—"}</dd>
              <dt>Master Account</dt>
              <dd>{master?.account_label ?? master?.account_number ?? "—"}</dd>
              <dt>Follower Account</dt>
              <dd>{follower?.account_label ?? follower?.account_number ?? "—"}</dd>
              <dt>Broker Return</dt>
              <dd className="mono">{row.code}</dd>
            </dl>
          </div>
          <div className="dz-section">
            <h4>Forensic Pricing Metrics</h4>
            <dl className="kv">
              <dt>Symbol</dt>
              <dd>
                <span className="sym-map">
                  {row.symbol}
                  {row.mapSymbol !== row.symbol && (
                    <>
                      <Icon name="arrowRight" size={12} className="arr" />
                      {row.mapSymbol}
                    </>
                  )}
                </span>
              </dd>
              <dt>Order Side</dt>
              <dd>
                <span className={`pill ${row.side === "Buy" ? "pill-buy" : "pill-sell"}`}>
                  {row.side}
                </span>
              </dd>
              <dt>Entry Price</dt>
              <dd className="mono">{row.entryPrice}</dd>
              <dt>Avg Fill</dt>
              <dd className="mono">{row.fillPrice}</dd>
              <dt>Slippage</dt>
              <dd className="mono">
                {row.slippagePips > 0 ? "+" : ""}
                {row.slippagePips} pips
              </dd>
              <dt>Lots Req / Exec</dt>
              <dd className="mono">
                {row.lotsReq.toFixed(2)} / {row.lotsExec.toFixed(2)}
              </dd>
              <dt>Latency</dt>
              <dd>
                <LatencyCell ms={row.latency} />
              </dd>
            </dl>
          </div>
          {(stale || failed) && (
            <div className="dz-section">
              <div className={`alert ${stale ? "alert-warn" : "alert-crit"}`}>
                <span className="a-ico">
                  <Icon name={stale ? "clock" : "alert"} size={16} />
                </span>
                {stale ? (
                  <div>
                    <strong>Copy operation skipped. </strong>
                    The signal exceeded the copier&apos;s max age boundary of{" "}
                    <span className="mono">{cp?.max_signal_age_ms ?? 3000}ms</span>. Remediation:
                    check worker latency or raise max signal age.
                  </div>
                ) : (
                  <div>
                    <strong>Execution rejected by broker. </strong>
                    Return code <span className="mono">{row.code}</span>.
                    {row.raw.error_message && ` ${row.raw.error_message}`}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="dz-section" style={{ borderBottom: "none" }}>
            <button
              type="button"
              className="row spread"
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
              onClick={() => setJsonOpen(!jsonOpen)}
            >
              <h4 style={{ margin: 0 }}>Raw Diagnostic Payload</h4>
              <Icon
                name={jsonOpen ? "chevronUp" : "chevronDown"}
                size={16}
                style={{ color: "var(--faint)" }}
              />
            </button>
            {jsonOpen && (
              <div style={{ marginTop: 11, position: "relative" }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}
                  onClick={copy}
                >
                  <Icon name={copied ? "check" : "copy"} size={13} />
                  {copied ? "Copied" : "Copy JSON"}
                </button>
                <pre className="json-box">{jsonStr}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function copierStatus(c: Copier): string {
  return c.is_enabled ? "active" : "paused";
}
