"use client";

import { useAdminOverview } from "@/components/admin/useAdminOverview";

export default function AdminSystemPage() {
  const { overview, loading } = useAdminOverview();

  if (loading && !overview) return <div className="admin-muted">Loading system status…</div>;

  const s = overview?.stats;

  return (
    <div>
      <div className="admin-head">
        <div>
          <h1>System health</h1>
          <p>Operational checklist for the copy platform you operate.</p>
        </div>
      </div>

      <div className="admin-grid-2">
        {[
          {
            title: "API & database",
            ok: true,
            detail: "Supabase + FastAPI control plane reachable from workers.",
          },
          {
            title: "Copy workers",
            ok: (s?.online_workers ?? 0) > 0,
            detail:
              (s?.online_workers ?? 0) > 0
                ? `${s?.online_workers} worker node(s) reporting heartbeat.`
                : "No workers online — customers cannot copy trades.",
          },
          {
            title: "Command queue",
            ok: (s?.pending_commands ?? 0) < 20,
            detail: `${s?.pending_commands ?? 0} pending worker commands (tests, config reload).`,
          },
          {
            title: "Execution quality",
            ok: (s?.failed_today ?? 0) === 0 || (s?.copies_today ?? 0) > (s?.failed_today ?? 0) * 5,
            detail: `${s?.failed_today ?? 0} failures vs ${s?.copies_today ?? 0} successes today.`,
          },
        ].map((item) => (
          <div key={item.title} className="card card-pad">
            <div className="row spread" style={{ marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>{item.title}</h3>
              <span className={`badge badge-${item.ok ? "ok" : "warn"}`}>
                {item.ok ? "Healthy" : "Attention"}
              </span>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="card card-pad" style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>Runbook reminders</h3>
        <ul className="admin-runbook">
          <li>Workers must run on Windows with broker MT5 terminals installed.</li>
          <li>Set <code>WORKER_POLL_INTERVAL_MS=150</code> (or lower on VPS) for faster detection.</li>
          <li>Production: one VPS per terminal cluster; keep copy hot path off HTTP except audit logs.</li>
          <li>Monitor avg E2E vs order ms — large gap means terminal switching queue, not broker slowness.</li>
        </ul>
      </div>
    </div>
  );
}
