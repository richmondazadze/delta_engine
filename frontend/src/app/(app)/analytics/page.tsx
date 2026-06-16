"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { PageIntro } from "@/components/shell/PageIntro";
import { useAccessToken } from "@/components/shell/AppProvider";
import type { ExecutionSlaResponse } from "@/lib/types";
import * as api from "@/lib/data";

function fmtMs(v: number | null | undefined) {
  if (v == null) return "—";
  return `${v} ms`;
}

function SlaMetric({
  label,
  stats,
  targetP95,
}: {
  label: string;
  stats: ExecutionSlaResponse["e2e_ms"];
  targetP95?: number;
}) {
  const breach =
    targetP95 != null && stats.p95 != null && stats.p95 > targetP95;
  return (
    <div className="metric-card">
      <div className="mc-label">{label}</div>
      <div className="mc-value" style={{ fontSize: 22 }}>
        {fmtMs(stats.p95)}
      </div>
      <div className="mc-foot">
        <span className="faint" style={{ fontSize: 11 }}>
          p95 · avg {fmtMs(stats.avg)} · max {fmtMs(stats.max)}
        </span>
        {targetP95 != null && (
          <span className={`grade-badge ${breach ? "warn" : "ok"}`}>
            {breach ? "Above target" : "On target"}
          </span>
        )}
      </div>
    </div>
  );
}

function gradeWinRate(rate: number | null): { label: string; grade: "ok" | "warn" | "avg" } {
  if (rate == null) return { label: "No data", grade: "avg" };
  if (rate >= 50) return { label: "Strong", grade: "ok" };
  if (rate >= 35) return { label: "Average", grade: "avg" };
  return { label: "Needs work", grade: "warn" };
}

function gradeFailureRate(failed: number, total: number): { label: string; grade: "ok" | "warn" | "avg" } {
  if (total === 0) return { label: "No copies yet", grade: "avg" };
  const pct = (failed / total) * 100;
  if (pct <= 5) return { label: "Healthy", grade: "ok" };
  if (pct <= 15) return { label: "Watch", grade: "avg" };
  return { label: "High failures", grade: "warn" };
}

function InsightCard({
  tone,
  title,
  body,
}: {
  tone: "positive" | "warning" | "neutral";
  title: string;
  body: string;
}) {
  return (
    <div className={`insight-card ${tone}`}>
      <div className="ins-title">{title}</div>
      <p className="ins-body">{body}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const getToken = useAccessToken();
  const [summary, setSummary] = useState<Awaited<
    ReturnType<typeof api.fetchAnalyticsSummary>
  > | null>(null);
  const [sla, setSla] = useState<ExecutionSlaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const [data, slaData] = await Promise.all([
          api.fetchAnalyticsSummary(token),
          api.fetchExecutionSla(token, 24),
        ]);
        if (mounted) {
          setSummary(data);
          setSla(slaData);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [getToken]);

  if (loading) {
    return (
      <div className="page-inner">
        <p className="faint">Loading your stats…</p>
      </div>
    );
  }

  if (!summary || summary.total_events === 0) {
    return (
      <div className="page-inner">
        <PageIntro description="See how your copying is going — wins, skips, and symbols." />
        <div className="card card-pad">
          <p className="faint" style={{ margin: 0, fontSize: 13.5 }}>
            No copy history yet. Turn on a setup and place a trade on your master — stats will appear here.
          </p>
        </div>
      </div>
    );
  }

  const win = gradeWinRate(summary.win_rate);
  const fail = gradeFailureRate(summary.failed, summary.total_events);
  const successRate =
    summary.total_events > 0
      ? Math.round(((summary.copied - summary.failed) / summary.total_events) * 100)
      : 0;

  let insightTone: "positive" | "warning" | "neutral" = "neutral";
  let insightTitle = "Your copy activity";
  let insightBody = `You've logged ${summary.total_events} copy events. ${summary.copied} completed successfully.`;

  if (fail.grade === "warn") {
    insightTone = "warning";
    insightTitle = "Some copies are failing";
    insightBody = `${summary.failed} failures out of ${summary.total_events} events. Check account connections and open the copy log for details.`;
  } else if (win.grade === "ok" && fail.grade === "ok") {
    insightTone = "positive";
    insightTitle = "Copying looks healthy";
    insightBody = `Most trades are copying through. Win rate (proxy) is ${summary.win_rate}% across closed copies.`;
  } else if (summary.skipped_risk + summary.skipped_slippage > summary.failed) {
    insightBody += ` ${summary.skipped_risk + summary.skipped_slippage} were skipped by your risk or speed rules — that's normal protection.`;
  }

  return (
    <div className="page-inner">
      <PageIntro
        description="Plain-language stats from your copy history — no jargon required."
        actions={
          <Link href="/logs" className="btn btn-ghost btn-sm">
            <Icon name="logs" size={14} />
            Open copy log
          </Link>
        }
      />

      <InsightCard tone={insightTone} title={insightTitle} body={insightBody} />

      {sla && sla.total_events > 0 && (
        <>
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="row gap8" style={{ marginBottom: 8 }}>
              <Icon name="gauge" size={16} style={{ color: "var(--accent)" }} />
              <h3 style={{ margin: 0, fontSize: 14 }}>Execution SLA (24h)</h3>
              <span
                className={`grade-badge ${sla.healthy ? "ok" : "warn"}`}
                style={{ marginLeft: "auto" }}
              >
                {sla.healthy ? "Healthy" : "Needs attention"}
              </span>
            </div>
            <p className="faint" style={{ margin: "0 0 14px", fontSize: 12.5 }}>
              End-to-end speed targets: p95 e2e &lt; {sla.targets.e2e_p95_ms}ms,
              order &lt; {sla.targets.order_p95_ms}ms. Failure rate &lt;{" "}
              {sla.targets.failure_rate_pct}%.
            </p>
            {sla.breaches.length > 0 && (
              <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontSize: 13 }}>
                {sla.breaches.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <SlaMetric label="End-to-end p95" stats={sla.e2e_ms} targetP95={sla.targets.e2e_p95_ms} />
            <SlaMetric label="Broker order p95" stats={sla.order_ms} targetP95={sla.targets.order_p95_ms} />
            <SlaMetric label="Terminal switch p95" stats={sla.switch_ms} targetP95={sla.targets.switch_p95_ms} />
            <div className="metric-card">
              <div className="mc-label">Failure rate</div>
              <div
                className="mc-value"
                style={{
                  color:
                    sla.failure_rate_pct > sla.targets.failure_rate_pct
                      ? "var(--error)"
                      : undefined,
                }}
              >
                {sla.failure_rate_pct}%
              </div>
              <div className="mc-foot">
                <span className="faint" style={{ fontSize: 11 }}>
                  {sla.failed} failed / {sla.total_events} events
                </span>
              </div>
            </div>
          </div>
          {sla.by_copier.length > 0 && (
            <div className="card card-pad" style={{ marginBottom: 20 }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 13 }}>Per setup (slowest first)</h4>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Setup</th>
                      <th>E2E p95</th>
                      <th>Order p95</th>
                      <th>Switch p95</th>
                      <th>Failed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sla.by_copier.slice(0, 8).map((row) => (
                      <tr key={row.copier_id}>
                        <td>
                          <Link href={`/logs?copier=${row.copier_id}`} className="link-action">
                            {row.copier_id.slice(0, 8)}…
                          </Link>
                        </td>
                        <td>{fmtMs(row.e2e.p95)}</td>
                        <td>{fmtMs(row.order.p95)}</td>
                        <td>{fmtMs(row.switch.p95)}</td>
                        <td>{row.failed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="metric-grid">
        <div className="metric-card">
          <div className="mc-label">Successful copies</div>
          <div className="mc-value">{summary.copied}</div>
          <div className="mc-foot">
            <span className="faint" style={{ fontSize: 11 }}>{successRate}% success</span>
            <span className={`grade-badge ${fail.grade}`}>{fail.label}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="mc-label">Failed copies</div>
          <div className="mc-value" style={{ color: summary.failed > 0 ? "var(--error)" : undefined }}>
            {summary.failed}
          </div>
          <div className="mc-foot">
            <span className="faint" style={{ fontSize: 11 }}>Needs attention</span>
            <span className={`grade-badge ${summary.failed === 0 ? "ok" : "warn"}`}>
              {summary.failed === 0 ? "None" : "Review log"}
            </span>
          </div>
        </div>
        <div className="metric-card">
          <div className="mc-label">Win rate (proxy)</div>
          <div className="mc-value">
            {summary.win_rate != null ? `${summary.win_rate}%` : "—"}
          </div>
          <div className="mc-foot">
            <span className="faint" style={{ fontSize: 11 }}>Closed copies</span>
            <span className={`grade-badge ${win.grade}`}>{win.label}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="mc-label">Skipped (protection)</div>
          <div className="mc-value">{summary.skipped_risk + summary.skipped_slippage}</div>
          <div className="mc-foot">
            <span className="faint" style={{ fontSize: 11 }}>Risk + speed rules</span>
            <span className="grade-badge avg">Normal</span>
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="row gap8" style={{ marginBottom: 12 }}>
          <Icon name="shield" size={16} style={{ color: "var(--accent)" }} />
          <h3 style={{ margin: 0, fontSize: 14 }}>Skipped &amp; ignored</h3>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>
          Blocked by risk limits: <strong>{summary.skipped_risk}</strong>
          {" · "}
          Too slow (slippage): <strong>{summary.skipped_slippage}</strong>
          {" · "}
          Duplicates ignored: <strong>{summary.duplicate_ignored}</strong>
        </p>
        {Object.keys(summary.symbols).length > 0 && (
          <>
            <h4 style={{ marginTop: 18, marginBottom: 10, fontSize: 13 }}>Most copied symbols</h4>
            <div className="row gap8" style={{ flexWrap: "wrap" }}>
              {Object.entries(summary.symbols)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([sym, n]) => (
                  <span key={sym} className="badge badge-plain">
                    {sym}: {n}
                  </span>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
