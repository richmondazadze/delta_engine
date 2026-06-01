"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import {
  ConfirmModal,
  EmptyHint,
  Kebab,
  StatusBadge,
  Tip,
} from "@/components/ui";
import { useApp, useAccessToken } from "@/components/shell/AppProvider";
import {
  accountDisplayName,
  connectionBadge,
  fmtMoney,
} from "@/lib/format";
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

  const test = async () => {
    setTesting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await api.testAccountConnection(token, a.id);
      toast("Connection test queued", "ok");
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
            <div className="faint" style={{ fontSize: 12 }}>
              {a.broker_server}
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
                    const token = await getToken();
                    if (!token) return;
                    await api.stopAccountSession(token, a.id);
                    toast("Worker session stopped", "ok");
                    onRefresh();
                  },
                },
                { sep: true },
                { label: "Disconnect Account", icon: "trash", danger: true, onClick: onDelete },
              ]}
            />
          </div>
        </div>
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
              Server
            </div>
            <div
              className="mono"
              style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {a.broker_server}
            </div>
          </div>
          <div>
            <div
              className="faint"
              style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Mode
            </div>
            <div className="mono" style={{ fontWeight: 600 }}>
              {a.account_mode}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            border: "1px solid var(--border)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
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

export default function AccountsPage() {
  const { accounts, accountLimit, refreshAll, toast } = useApp();
  const getToken = useAccessToken();
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
        <div className="page-head">
          <div className="pt">
            <h1>Trading Accounts</h1>
            <p className="desc">
              Connect and manage MT5 accounts. Passwords are write-only and encrypted at rest.
            </p>
          </div>
          <div className="actions">
            <Link href="/accounts/new" className="btn btn-dark">
              <Icon name="plus" size={15} />
              Link Account
            </Link>
          </div>
        </div>
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
      <div className="page-head">
        <div className="pt">
          <h1>Trading Accounts</h1>
          <p className="desc">
            Connect and manage MT5 accounts. Passwords are write-only and encrypted at rest.
          </p>
        </div>
        <div className="actions">
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
        </div>
      </div>
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
        <select className="sel" style={{ width: 150 }} defaultValue="mt5">
          <option value="mt5">MetaTrader 5</option>
          <option disabled>MetaTrader 4 — soon</option>
          <option disabled>cTrader — soon</option>
        </select>
        <div className="grow" />
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((a) => (
          <AccountBlade
            key={a.id}
            a={a}
            onDelete={() => setConfirmDel(a)}
            onRefresh={refreshAll}
          />
        ))}
      </div>
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
  const router = useRouter();
  const { toast, refreshAll } = useApp();
  const getToken = useAccessToken();
  const [f, setF] = useState({ name: "", login: "", server: "", pw: "" });
  const [show, setShow] = useState(false);
  const [adv, setAdv] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });
  const valid = f.name && f.login && f.server && f.pw;

  const save = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await api.createAccount(token, {
        platform: "mt5",
        account_number: f.login,
        broker_server: f.server,
        password: f.pw,
        account_label: f.name,
      });
      toast("Account connection saved", "ok");
      await refreshAll();
      router.push("/accounts");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "err");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-inner" style={{ maxWidth: 560 }}>
      <Link href="/accounts" className="link-action" style={{ color: "var(--muted)", marginBottom: 14 }}>
        <Icon name="chevronLeft" size={14} />
        Back to accounts
      </Link>
      <h1 style={{ fontSize: 21, margin: "0 0 18px", letterSpacing: "-0.02em" }}>
        Link Trading Account
      </h1>
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <span className="a-ico">
          <Icon name="lock" size={16} />
        </span>
        <div>
          <strong>Security protocol. </strong>
          Broker passwords are encrypted with AES-256-GCM at rest and are write-only. Your
          plain-text password can never be retrieved after submission.
        </div>
      </div>
      <div className="card card-pad">
        <div className="field">
          <label>Account friendly name</label>
          <input
            className="inp"
            placeholder="e.g. Demo Master"
            value={f.name}
            onChange={set("name")}
          />
        </div>
        <div className="field">
          <label>Platform</label>
          <select className="sel" disabled>
            <option>MetaTrader 5</option>
          </select>
        </div>
        <div className="row gap12">
          <div className="field" style={{ flex: 1 }}>
            <label>Login ID</label>
            <input
              className="inp mono"
              placeholder="436006434"
              value={f.login}
              onChange={set("login")}
              inputMode="numeric"
            />
          </div>
          <div className="field" style={{ flex: 1.4 }}>
            <label>Broker server</label>
            <input
              className="inp mono"
              placeholder="Exness-MT5Trial9"
              value={f.server}
              onChange={set("server")}
            />
          </div>
        </div>
        <div className="field">
          <label>Account password</label>
          <div className="inp-wrap">
            <input
              className="inp mono"
              type={show ? "text" : "password"}
              placeholder="••••••••••"
              value={f.pw}
              onChange={set("pw")}
              style={{ paddingRight: 38 }}
            />
            <button type="button" className="eye" onClick={() => setShow(!show)}>
              <Icon name={show ? "eyeOff" : "eye"} size={16} />
            </button>
          </div>
          <div className="hint">Write-only. Encrypted immediately on submit.</div>
        </div>
        <div className="divider" />
        <button
          type="button"
          className="row spread"
          style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer" }}
          onClick={() => setAdv(!adv)}
        >
          <span style={{ fontWeight: 600, fontSize: 13 }}>Advanced parameters</span>
          <Icon
            name={adv ? "chevronUp" : "chevronDown"}
            size={16}
            style={{ color: "var(--faint)" }}
          />
        </button>
        {adv && (
          <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
            <label>Custom terminal directory</label>
            <input className="inp mono" placeholder="/opt/mt5/terminals/custom" disabled />
            <div className="hint">Override path — configured on worker in Phase 4.</div>
          </div>
        )}
      </div>
      <div className="row gap10" style={{ marginTop: 18, justifyContent: "flex-end" }}>
        <Link href="/accounts" className="btn btn-ghost">
          Cancel
        </Link>
        <button
          type="button"
          className="btn btn-dark"
          disabled={!valid || saving}
          onClick={save}
        >
          {saving ? "Saving…" : "Save Account Connection"}
        </button>
      </div>
    </div>
  );
}
