"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { copierStatus } from "@/components/forensic/ForensicDrawer";
import {
  ConfirmModal,
  EmptyHint,
  LatencyCell,
  StatusBadge,
  Tabs,
  Toggle,
} from "@/components/ui";
import { useApp, useAccessToken } from "@/components/shell/AppProvider";
import {
  accountDisplayName,
  connectionBadge,
  fmtClock,
  fmtMoney,
} from "@/lib/format";
import * as api from "@/lib/data";

export default function AccountDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { accById, copiers, logs, refreshAll, toast } = useApp();
  const getToken = useAccessToken();
  const a = accById(id);
  const [tab, setTab] = useState("overview");
  const [confirmDel, setConfirmDel] = useState(false);

  if (!a) {
    return (
      <div className="page-inner">
        <EmptyHint icon="server" title="Account not found">
          It may have been disconnected.
        </EmptyHint>
      </div>
    );
  }

  const name = accountDisplayName(a.account_label, a.account_number);
  const rels = copiers.filter(
    (c) => c.master_account_id === id || c.follower_account_id === id,
  );
  const events = logs
    .filter((r) => {
      const cp = copiers.find((c) => c.id === r.copierId);
      return cp && (cp.master_account_id === id || cp.follower_account_id === id);
    })
    .slice(0, 14);

  const toggleEnabled = async (v: boolean) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await api.updateAccount(token, id, { is_enabled: v });
      toast(v ? "Account enabled" : "Account paused", "ok");
      await refreshAll();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed", "err");
    }
  };

  const handleDelete = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await api.deleteAccount(token, id);
      toast("Account deleted", "ok");
      router.push("/accounts");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed", "err");
    }
  };

  return (
    <div className="page-inner">
      <Link href="/accounts" className="link-action" style={{ color: "var(--muted)", marginBottom: 14 }}>
        <Icon name="chevronLeft" size={14} />
        Trading Accounts
      </Link>
      <div className="page-head" style={{ alignItems: "center" }}>
        <div className="pt">
          <div className="row gap10">
            <h1 style={{ margin: 0 }}>{name}</h1>
            <StatusBadge status={connectionBadge(a.connection_status)} />
          </div>
          <p className="desc" style={{ marginTop: 4 }}>
            {a.broker_server} · <span className="mono">{a.account_number}</span>
          </p>
        </div>
        <div className="actions row gap10" style={{ alignItems: "center" }}>
          <span className="fz12 fw600 muted">Account Enabled</span>
          <Toggle on={a.is_enabled} onChange={toggleEnabled} />
        </div>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: "Infrastructure Overview" },
          { value: "paths", label: "Relation Paths" },
          { value: "events", label: "Terminal Events" },
        ]}
      />
      {tab === "overview" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
              gap: 14,
              marginBottom: 18,
            }}
          >
            {[
              ["Balance", fmtMoney(a.balance), true],
              ["Equity", fmtMoney(a.equity), true],
              ["Leverage", a.leverage ? `1:${a.leverage}` : "—", true],
              ["Execution Model", a.account_mode, false],
              ["Currency", a.currency ?? "—", true],
            ].map(([k, v, mono]) => (
              <div key={k as string} className="card card-pad">
                <div
                  className="faint"
                  style={{
                    fontSize: 10.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 6,
                  }}
                >
                  {k as string}
                </div>
                <div className={mono ? "mono" : ""} style={{ fontWeight: 600, fontSize: 18 }}>
                  {v as string}
                </div>
              </div>
            ))}
          </div>
          <div className="row gap10">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={async () => {
                const token = await getToken();
                if (!token) return;
                await api.testAccountConnection(token, id);
                toast("Connection test queued", "ok");
              }}
            >
              <Icon name="refresh" size={14} />
              Test Connection
            </button>
            <button
              type="button"
              className="btn btn-accent"
              onClick={async () => {
                const token = await getToken();
                if (!token) return;
                await api.startAccountSession(token, id);
                toast("Worker session started", "ok");
              }}
            >
              <Icon name="play" size={14} />
              Start Session
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={async () => {
                const token = await getToken();
                if (!token) return;
                await api.stopAccountSession(token, id);
                toast("Worker disconnected", "ok");
              }}
            >
              <Icon name="power" size={14} />
              Force Disconnect
            </button>
          </div>
        </div>
      )}
      {tab === "paths" && (
        <div className="card" style={{ overflow: "hidden" }}>
          {rels.length === 0 ? (
            <EmptyHint icon="branch" title="No copier links">
              This node is not used by any pipeline yet.
            </EmptyHint>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  {["Copier", "Role", "Counterparty", "Allocation", "Status"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rels.map((c) => {
                  const role = c.master_account_id === id ? "Master" : "Follower";
                  const otherId =
                    c.master_account_id === id ? c.follower_account_id : c.master_account_id;
                  const other = accById(otherId);
                  const alloc =
                    c.risk_mode === "multiplier"
                      ? `${c.multiplier.toFixed(2)}x`
                      : `${c.fixed_lot_size.toFixed(2)} lots`;
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.label}</td>
                      <td>
                        <span
                          className={`badge ${role === "Master" ? "badge-accent" : "badge-muted"}`}
                        >
                          {role}
                        </span>
                      </td>
                      <td>
                        {other
                          ? accountDisplayName(other.account_label, other.account_number)
                          : "—"}
                      </td>
                      <td className="num">{alloc}</td>
                      <td>
                        <StatusBadge status={copierStatus(c)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === "events" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                {["Time", "Status", "Event", "Symbol", "Latency"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted" style={{ textAlign: "center", padding: 24 }}>
                    No events for this account yet.
                  </td>
                </tr>
              ) : (
                events.map((r) => (
                  <tr key={r.id}>
                    <td className="num t-time">{fmtClock(r.t)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>{r.eventType}</td>
                    <td className="num">{r.symbol}</td>
                    <td>
                      <LatencyCell ms={r.latency} bar />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="danger-zone" style={{ marginTop: 26 }}>
        <div className="dz-head">
          <h3>Delete Trading Account</h3>
        </div>
        <div className="row spread" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: 12.5, color: "var(--muted)", maxWidth: 460 }}>
            Permanently remove this terminal from the engine. Associated copier links will be
            suspended.
          </div>
          <button type="button" className="btn btn-danger" onClick={() => setConfirmDel(true)}>
            <Icon name="trash" size={14} />
            Delete Trading Account
          </button>
        </div>
      </div>
      {confirmDel && (
        <ConfirmModal
          title={`Delete ${name}?`}
          confirmWord="DELETE"
          confirmLabel="Delete account"
          body="This permanently removes the terminal and its worker session. Copier links using it will be suspended."
          onCancel={() => setConfirmDel(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
