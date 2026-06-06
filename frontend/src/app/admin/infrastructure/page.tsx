"use client";

import { StatusBadge } from "@/components/ui";
import { useAdminOverview } from "@/components/admin/useAdminOverview";
import { fmtClock } from "@/lib/format";

export default function AdminInfrastructurePage() {
  const { overview, loading } = useAdminOverview();

  if (loading && !overview) return <div className="admin-muted">Loading infrastructure…</div>;

  return (
    <div>
      <div className="admin-head">
        <div>
          <h1>Workers & sessions</h1>
          <p>Copy engine nodes, capacity, and per-account terminal sessions.</p>
        </div>
      </div>

      <h2 className="admin-section-title">Worker nodes</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Host</th>
                <th>Region</th>
                <th>Status</th>
                <th>Load</th>
                <th>Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.workers ?? []).map((w) => (
                <tr key={w.id}>
                  <td>{w.worker_name || "—"}</td>
                  <td className="mono faint">{w.host_identifier || "—"}</td>
                  <td>{w.region || "—"}</td>
                  <td>
                    <StatusBadge
                      status={w.online ? "ok" : "warn"}
                      label={w.online ? "Online" : w.status || "Offline"}
                    />
                  </td>
                  <td className="mono">
                    {w.active_sessions ?? 0}/{w.capacity ?? 1}
                  </td>
                  <td className="mono faint">
                    {w.last_heartbeat_at
                      ? fmtClock(new Date(w.last_heartbeat_at))
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="admin-section-title">Active sessions</h2>
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Status</th>
                <th>Account</th>
                <th>Started</th>
                <th>Last heartbeat</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.sessions ?? []).map((s) => (
                <tr key={String(s.id)}>
                  <td>
                    <span className="badge badge-plain">{String(s.session_status)}</span>
                  </td>
                  <td className="mono faint">{String(s.trading_account_id).slice(0, 8)}…</td>
                  <td className="mono faint">
                    {s.started_at ? fmtClock(new Date(String(s.started_at))) : "—"}
                  </td>
                  <td className="mono faint">
                    {s.last_heartbeat_at
                      ? fmtClock(new Date(String(s.last_heartbeat_at)))
                      : "—"}
                  </td>
                  <td style={{ fontSize: 12, maxWidth: 240 }} className="truncate">
                    {String(s.last_error || "—")}
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
