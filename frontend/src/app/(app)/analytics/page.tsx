"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { PageIntro } from "@/components/shell/PageIntro";
import { useAccessToken } from "@/components/shell/AppProvider";
import * as api from "@/lib/data";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const data = await api.fetchAnalyticsSummary(token);
        if (mounted) setSummary(data);
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
