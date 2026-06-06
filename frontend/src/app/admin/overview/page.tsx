"use client";

import { Icon } from "@/components/icons/Icon";
import { KpiCard } from "@/components/ui";
import { useAdminOverview } from "@/components/admin/useAdminOverview";
import { fmtClock } from "@/lib/format";

export default function AdminOverviewPage() {
  const { overview, loading, error, reload } = useAdminOverview();

  if (loading && !overview) {
    return <div className="admin-muted">Loading platform metrics…</div>;
  }
  if (error || !overview) {
    return (
      <div className="admin-muted">
        {error ?? "No data"}
        <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>
          Retry
        </button>
      </div>
    );
  }

  const s = overview.stats;

  return (
    <div>
      <div className="admin-head">
        <div>
          <h1>Platform overview</h1>
          <p>Live health of CopyMorphic — customers, copy engine, and execution quality.</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>
          <Icon name="refresh" size={14} />
          Refresh
        </button>
      </div>
      <p className="admin-muted mono" style={{ marginBottom: 16, fontSize: 11 }}>
        As of {fmtClock(new Date(overview.as_of))}
      </p>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <KpiCard label="Customers" value={String(s.users_total)} sub="Registered users" />
        <KpiCard
          label="Trading accounts"
          value={String(s.accounts_total)}
          sub={`${s.accounts_connected} connected`}
        />
        <KpiCard
          label="Active copy links"
          value={String(s.copiers_active)}
          sub={`${s.copiers_total} total configurations`}
        />
        <KpiCard
          label="Copies today"
          value={String(s.copies_today)}
          sub={`${s.failed_today} failed · ${s.pending_commands} queued commands`}
        />
        <KpiCard
          label="Workers online"
          value={String(s.online_workers)}
          sub={`${s.workers_total} nodes · ${s.active_sessions} sessions`}
        />
        <KpiCard
          label="Avg speed today"
          value={s.avg_e2e_ms_today != null ? `${s.avg_e2e_ms_today} ms` : "—"}
          sub={
            s.avg_order_ms_today != null
              ? `Order ${s.avg_order_ms_today} ms · Switch ${s.avg_switch_ms_today ?? "—"} ms`
              : "End-to-end copy time"
          }
        />
      </div>

      <div className="admin-grid-2">
        <div className="card card-pad">
          <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Plans distribution</h3>
          <div className="row gap8" style={{ flexWrap: "wrap" }}>
            {Object.entries(s.users_by_plan).map(([plan, count]) => (
              <span key={plan} className="badge badge-plain">
                {plan}: {count}
              </span>
            ))}
          </div>
        </div>
        <div className="card card-pad">
          <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Account connection states</h3>
          <div className="row gap8" style={{ flexWrap: "wrap" }}>
            {Object.entries(s.accounts_by_status).map(([st, count]) => (
              <span key={st} className="badge badge-plain">
                {st}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
