"use client";

import { TimingCell } from "@/components/ui";
import { useAdminOverview } from "@/components/admin/useAdminOverview";
import { fmtClock, humanEventType, humanExecutionStatus } from "@/lib/format";

export default function AdminExecutionsPage() {
  const { overview, loading } = useAdminOverview();

  if (loading && !overview) return <div className="admin-muted">Loading executions…</div>;

  return (
    <div>
      <div className="admin-head">
        <div>
          <h1>Global executions</h1>
          <p>Cross-tenant copy audit — successes, failures, and speed breakdown.</p>
        </div>
      </div>

      <h2 className="admin-section-title">Recent failures</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Event</th>
                <th>Symbol</th>
                <th>Error</th>
                <th>E2E</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.failed_events ?? []).map((e) => (
                <tr key={e.id}>
                  <td className="mono faint">{fmtClock(new Date(e.created_at))}</td>
                  <td>{overview?.user_emails?.[e.user_id]?.split("@")[0] ?? "—"}</td>
                  <td>{humanEventType(e.event_type)}</td>
                  <td className="mono">{e.symbol_master || "—"}</td>
                  <td style={{ fontSize: 12 }}>{e.error_message || e.status}</td>
                  <td className="mono faint">{e.e2e_ms != null ? `${e.e2e_ms} ms` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="admin-section-title">Latest copies (all users)</h2>
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Status</th>
                <th>Event</th>
                <th>Symbol</th>
                <th>Speed</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.recent_executions ?? []).map((e) => (
                <tr key={e.id}>
                  <td className="mono faint">{fmtClock(new Date(e.created_at))}</td>
                  <td>{e.user_email?.split("@")[0] ?? "—"}</td>
                  <td>{humanExecutionStatus(e.status)}</td>
                  <td>{humanEventType(e.event_type)}</td>
                  <td className="mono">{e.symbol_master || "—"}</td>
                  <td>
                    <TimingCell
                      e2eMs={e.e2e_ms ?? e.latency_ms}
                      orderMs={e.order_ms}
                      switchMs={e.switch_ms}
                      compact
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
