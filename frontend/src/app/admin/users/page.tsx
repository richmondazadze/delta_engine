"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui";
import { useAdminOverview } from "@/components/admin/useAdminOverview";
import { useAccessToken } from "@/components/shell/AppProvider";
import * as api from "@/lib/data";
import { fmtClock } from "@/lib/format";

const PLANS = ["free", "standard", "premium", "analyzer", "dedicated", "admin"];

export default function AdminUsersPage() {
  const { overview, loading, reload } = useAdminOverview();
  const getToken = useAccessToken();
  const [savingId, setSavingId] = useState<string | null>(null);

  const onPlanChange = async (userId: string, plan: string) => {
    const token = await getToken();
    if (!token) return;
    setSavingId(userId);
    try {
      await api.updateAdminUserPlan(token, userId, plan);
      await reload();
    } finally {
      setSavingId(null);
    }
  };

  if (loading && !overview) return <div className="admin-muted">Loading customers…</div>;

  return (
    <div>
      <div className="admin-head">
        <div>
          <h1>Customers</h1>
          <p>Manage subscription plans and monitor who is on the platform.</p>
        </div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Email</th>
                <th>Plan</th>
                <th>Billing</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.users ?? []).map((u) => (
                <tr key={u.id}>
                  <td>{u.email || u.id.slice(0, 8)}</td>
                  <td>
                    <select
                      className="inp inp-sm"
                      value={u.subscription_plan}
                      disabled={savingId === u.id}
                      onChange={(e) => onPlanChange(u.id, e.target.value)}
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <StatusBadge
                      status={u.is_active_subscriber ? "ok" : "muted"}
                      label={u.is_active_subscriber ? "Paying" : "Free"}
                    />
                  </td>
                  <td className="mono faint">
                    {u.created_at ? fmtClock(new Date(u.created_at)) : "—"}
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
