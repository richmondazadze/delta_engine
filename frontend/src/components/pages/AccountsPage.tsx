"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import {
  ConfirmModal,
  EmptyHint,
  AnimatedViewMode,
  Kebab,
  StaggerItem,
  StatusBadge,
  Tip,
  useViewMode,
  ViewModeToggle,
} from "@/components/ui";
import { PageIntro } from "@/components/shell/PageIntro";
import { useApp, useAccessToken } from "@/components/shell/AppProvider";
import {
  accountDisplayName,
  connectionBadge,
  fmtMoney,
} from "@/lib/format";
import { PlatformBadge } from "@/components/PlatformIcon";
import { PLATFORMS_WITH_ICONS } from "@/lib/platforms";
import { LinkAccountForm } from "@/components/accounts/LinkAccountForm";
import * as api from "@/lib/data";
import type { Account } from "@/lib/types";

function AccountBlade({
  a,
  onDelete,
  onRefresh,
}: {
  a: Account;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const { toast } = useApp();
  const getToken = useAccessToken();
  const [testing, setTesting] = useState(false);
  const name = accountDisplayName(a.account_label, a.account_number);

  const firmName =
    a.platform === "dxtrade" &&
    a.account_metadata &&
    typeof a.account_metadata.firm_name === "string"
      ? (a.account_metadata.firm_name as string)
      : null;

  const brokerName =
    a.platform === "mt5" &&
    a.account_metadata &&
    typeof a.account_metadata.broker_name === "string"
      ? (a.account_metadata.broker_name as string)
      : null;

  const test = async () => {
    setTesting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const res = await api.testAccountConnection(token, a.id);
      const msg = res.message || res.status || "Test complete";
      const ok = res.status === "connected";
      toast(msg, ok ? "ok" : "err");
      onRefresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Test failed", "err");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 16, flex: 1 }}>
        <div className="row spread" style={{ marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>{name}</div>
            <div className="faint row gap8" style={{ fontSize: 12 }}>
              {brokerName ? `${brokerName} · ` : firmName ? `${firmName} · ` : ""}
              {a.platform === "dxtrade" ? `domain ${a.broker_server}` : a.broker_server}
              <PlatformBadge platformId={a.platform} />
            </div>
          </div>
          <div className="row gap8">
            <StatusBadge status={connectionBadge(a.connection_status)} />
            <Kebab
              items={[
              { label: "View Profile", icon: "edit", onClick: () => window.location.assign(`/accounts/${a.id}`) },
                { label: "Force Test Connection", icon: "refresh", onClick: test },
                {
                  label: "Stop Worker Session",
                  icon: "stop",
                  onClick: async () => {
                    try {
                      const token = await getToken();
                      if (!token) throw new Error("Not authenticated");
                      await api.stopAccountSession(token, a.id);
                      toast("Worker session stopped", "ok");
                      onRefresh();
                    } catch (e) {
                      toast(e instanceof Error ? e.message : "Stop failed", "err");
                    }
                  },
                },
                { sep: true },
                { label: "Disconnect Account", icon: "trash", danger: true, onClick: onDelete },
              ]}
            />
          </div>
        </div>
        {a.last_error && a.connection_status !== "connected" && (
          <div
            className="muted"
            style={{ fontSize: 12, lineHeight: 1.45, marginBottom: 12 }}
          >
            {a.last_error}
          </div>
        )}
        <div className="row gap16" style={{ marginBottom: 14, fontSize: 12 }}>
          <div>
            <div
              className="faint"
              style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Login
            </div>
            <div className="mono" style={{ fontWeight: 600 }}>
              {a.account_number}
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              className="faint"
              style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              {a.platform === "dxtrade" ? "Domain" : "Server"}
            </div>
            <div
              className="mono"
              style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {a.broker_server}
            </div>
          </div>
          {a.platform === "dxtrade" && a.api_base_url && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                className="faint"
                style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                API host
              </div>
              <div
                className="mono"
                style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", fontSize: 11 }}
              >
                {a.api_base_url}
              </div>
            </div>
          )}
        </div>
        <div className="grid-account-balances">
          <div style={{ padding: "10px 13px", borderRight: "1px solid var(--border)" }}>
            <div
              className="faint"
              style={{
                fontSize: 10.5,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 2,
              }}
            >
              Balance
            </div>
            <div className="mono" style={{ fontWeight: 600, fontSize: 15 }}>
              {fmtMoney(a.balance)}
            </div>
          </div>
          <div style={{ padding: "10px 13px" }}>
            <div
              className="faint"
              style={{
                fontSize: 10.5,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 2,
              }}
            >
              Equity
            </div>
            <div
              className="mono"
              style={{
                fontWeight: 600,
                fontSize: 15,
                color:
                  (a.equity ?? 0) >= (a.balance ?? 0) ? "var(--success)" : "var(--error)",
              }}
            >
              {fmtMoney(a.equity)}
            </div>
          </div>
        </div>
      </div>
      <div className="card-foot" style={{ justifyContent: "space-between" }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={test}
          disabled={testing}
        >
          <Icon
            name="refresh"
            size={13}
            style={testing ? { animation: "spin 0.8s linear infinite" } : undefined}
          />
          {testing ? "Testing…" : "Test Connection"}
        </button>
        <Link href={`/accounts/${a.id}`} className="link-action">
          View Profile Details
          <Icon name="chevronRight" size={14} />
        </Link>
      </div>
    </div>
  );
}

function AccountListRow({
  a,
  index,
  onDelete,
  onRefresh,
}: {
  a: Account;
  index: number;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const { toast } = useApp();
  const getToken = useAccessToken();
  const [testing, setTesting] = useState(false);
  const name = accountDisplayName(a.account_label, a.account_number);

  const test = async () => {
    setTesting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const res = await api.testAccountConnection(token, a.id);
      const msg = res.message || res.status || "Test complete";
      const ok = res.status === "connected";
      toast(msg, ok ? "ok" : "err");
      onRefresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Test failed", "err");
    } finally {
      setTesting(false);
    }
  };

  return (
    <tr
      className="t-view-item"
      style={{ ["--i" as string]: index } as CSSProperties}
    >
      <td>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
        <div className="faint mono" style={{ fontSize: 11.5 }}>
          {a.account_number}
        </div>
      </td>
      <td>
        <PlatformBadge platformId={a.platform} size="lg" />
      </td>
      <td>
        <StatusBadge status={connectionBadge(a.connection_status)} />
      </td>
      <td className="num mono">{fmtMoney(a.balance)}</td>
      <td
        className="num mono"
        style={{
          color: (a.equity ?? 0) >= (a.balance ?? 0) ? "var(--success)" : "var(--error)",
        }}
      >
        {fmtMoney(a.equity)}
      </td>
      <td>
        <div className="row gap8" style={{ justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={test}
            disabled={testing}
          >
            {testing ? "…" : "Test"}
          </button>
          <Link href={`/accounts/${a.id}`} className="btn btn-ghost btn-sm">
            View
          </Link>
          <Kebab
            items={[
              {
                label: "Disconnect",
                icon: "trash",
                danger: true,
                onClick: onDelete,
              },
            ]}
          />
        </div>
      </td>
    </tr>
  );
}

function accountRole(
  a: Account,
  copiers: { master_account_id: string; follower_account_id: string }[],
): "master" | "follower" | "standalone" {
  if (copiers.some((c) => c.master_account_id === a.id)) return "master";
  if (copiers.some((c) => c.follower_account_id === a.id)) return "follower";
  return "standalone";
}

function AccountCluster({
  title,
  desc,
  items,
  viewMode,
  onDelete,
  onRefresh,
}: {
  title: string;
  desc: string;
  items: Account[];
  viewMode: "cards" | "list";
  onDelete: (a: Account) => void;
  onRefresh: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h2>
        <p className="faint" style={{ margin: "4px 0 0", fontSize: 12.5 }}>
          {desc}
        </p>
      </div>
      <AnimatedViewMode
        mode={viewMode}
        cards={
          <div
              className="grid-accounts-cards"
          >
            {items.map((a, i) => (
              <StaggerItem key={a.id} index={i}>
                <AccountBlade
                  a={a}
                  onDelete={() => onDelete(a)}
                  onRefresh={onRefresh}
                />
              </StaggerItem>
            ))}
          </div>
        }
        list={
          <div className="card" style={{ overflow: "hidden", overflowX: "auto" }}>
            <table className="tbl" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  {["Account", "Platform", "Status", "Balance", "Equity", ""].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((a, i) => (
                  <AccountListRow
                    key={a.id}
                    a={a}
                    index={i}
                    onDelete={() => onDelete(a)}
                    onRefresh={onRefresh}
                  />
                ))}
              </tbody>
            </table>
          </div>
        }
      />
    </section>
  );
}

export default function AccountsPage() {
  const { accounts, copiers, accountLimit, refreshAll, toast } = useApp();
  const getToken = useAccessToken();
  const { mode: viewMode, setMode: setViewMode } = useViewMode("de_accounts_view", "cards");
  const [q, setQ] = useState("");
  const [confirmDel, setConfirmDel] = useState<Account | null>(null);
  const atQuota = accounts.length >= accountLimit;

  const filtered = accounts.filter(
    (a) =>
      !q ||
      accountDisplayName(a.account_label, a.account_number)
        .toLowerCase()
        .includes(q.toLowerCase()) ||
      a.account_number.includes(q),
  );

  const masters = filtered.filter((a) => accountRole(a, copiers) === "master");
  const followers = filtered.filter((a) => accountRole(a, copiers) === "follower");
  const standalone = filtered.filter((a) => accountRole(a, copiers) === "standalone");

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await api.deleteAccount(token, confirmDel.id);
      toast("Account disconnected", "ok");
      setConfirmDel(null);
      await refreshAll();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed", "err");
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="page-inner">
        <PageIntro
          description="Connect and manage MT5 accounts. Passwords are write-only and encrypted at rest."
          actions={
            <Link href="/accounts/new" className="btn btn-dark">
              <Icon name="plus" size={15} />
              Link Account
            </Link>
          }
        />
        <div className="card">
          <EmptyHint icon="server" title="No accounts linked">
            Link your first MT5 terminal to begin copying.
          </EmptyHint>
        </div>
      </div>
    );
  }

  return (
    <div className="page-inner">
      <PageIntro
        description="Connect MT5 or DXtrade accounts (FTMO, Lark, and more). Passwords are write-only and encrypted at rest."
        actions={
          <Tip text={atQuota ? "Account limit reached" : "Link a new MT5 terminal"}>
            <Link
              href={atQuota ? "#" : "/accounts/new"}
              className={`btn btn-dark${atQuota ? " disabled" : ""}`}
              aria-disabled={atQuota}
              onClick={(e) => atQuota && e.preventDefault()}
            >
              <Icon name="plus" size={15} />
              Link Account
            </Link>
          </Tip>
        }
      />
      <div
        className="card"
        style={{
          padding: 10,
          marginBottom: 16,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <select className="sel" style={{ width: 180 }} defaultValue="mt5">
          {PLATFORMS_WITH_ICONS.map((p) => (
            <option key={p.id} value={p.id} disabled={p.phase !== "live"}>
              {p.name}
              {p.phase === "live" ? "" : " — soon"}
            </option>
          ))}
        </select>
        <div className="grow" />
        <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        <div className="inp-wrap" style={{ width: 220 }}>
          <input
            className="inp"
            placeholder="Search accounts…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ paddingLeft: 30 }}
          />
          <Icon
            name="search"
            size={14}
            style={{ position: "absolute", left: 9, top: 11, color: "var(--faint)" }}
          />
        </div>
      </div>
      {atQuota && (
        <div className="alert alert-warn" style={{ marginBottom: 16 }}>
          <span className="a-ico">
            <Icon name="info" size={16} />
          </span>
          <div>
            <strong>
              Account threshold reached ({accounts.length}/{accountLimit}).{" "}
            </strong>
            Upgrade your package tier to scale beyond the limit.
          </div>
        </div>
      )}
      <AccountCluster
        title="Master accounts"
        desc="Accounts that send trades to your followers."
        items={masters}
        viewMode={viewMode}
        onDelete={setConfirmDel}
        onRefresh={refreshAll}
      />
      <AccountCluster
        title="Follower accounts"
        desc="Accounts that receive copied trades."
        items={followers}
        viewMode={viewMode}
        onDelete={setConfirmDel}
        onRefresh={refreshAll}
      />
      <AccountCluster
        title="Other accounts"
        desc="Linked accounts not used in a copy setup yet."
        items={standalone}
        viewMode={viewMode}
        onDelete={setConfirmDel}
        onRefresh={refreshAll}
      />
      {confirmDel && (
        <ConfirmModal
          title={`Disconnect ${accountDisplayName(confirmDel.account_label, confirmDel.account_number)}?`}
          confirmWord="DISCONNECT"
          confirmLabel="Disconnect account"
          body="This stops the worker session and removes the terminal from the engine. Copier links using it will be suspended."
          onCancel={() => setConfirmDel(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

export function AccountNewPage() {
  return <LinkAccountForm />;
}
