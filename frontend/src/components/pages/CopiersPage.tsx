"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import {
  ConfirmModal,
  EmptyHint,
  Kebab,
  Tip,
  Toggle,
} from "@/components/ui";
import { useApp, useAccessToken } from "@/components/shell/AppProvider";
import { accountDisplayName } from "@/lib/format";
import * as api from "@/lib/data";
import type { Copier } from "@/lib/types";

function RuleIcons({ rules }: { rules: { sl: boolean; tp: boolean; close: boolean; modify: boolean } }) {
  const map: [keyof typeof rules, "shield" | "target" | "power" | "edit", string][] = [
    ["sl", "shield", "Stop Loss"],
    ["tp", "target", "Take Profit"],
    ["close", "power", "Manual Close"],
    ["modify", "edit", "Modify"],
  ];
  return (
    <div className="row gap6">
      {map.map(([k, ic, label]) => (
        <Tip key={k} text={`${label}${rules[k] ? " · on" : " · off"}`}>
          <span
            style={{
              display: "flex",
              color: rules[k] ? "var(--accent)" : "var(--border-strong)",
            }}
          >
            <Icon name={ic} size={15} />
          </span>
        </Tip>
      ))}
    </div>
  );
}

export default function CopiersPage() {
  const router = useRouter();
  const { accounts, copiers, accById, refreshAll, toast } = useApp();
  const getToken = useAccessToken();
  const [confirmDel, setConfirmDel] = useState<Copier | null>(null);

  const toggle = async (c: Copier) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      if (c.is_enabled) await api.disableCopier(token, c.id);
      else await api.enableCopier(token, c.id);
      toast(c.is_enabled ? "Copier suspended" : "Copier activated", "ok");
      await refreshAll();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Toggle failed", "err");
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await api.deleteCopier(token, confirmDel.id);
      toast("Copier link deleted", "ok");
      setConfirmDel(null);
      await refreshAll();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed", "err");
    }
  };

  return (
    <div className="page-inner">
      <div className="page-head">
        <div className="pt">
          <h1>Copier Links</h1>
          <p className="desc">
            Route trades from a master terminal to one or more followers with precise allocation
            and risk rules.
          </p>
        </div>
        <div className="actions">
          <Link
            href={accounts.length < 2 ? "#" : "/copiers/new"}
            className={`btn btn-dark${accounts.length < 2 ? " disabled" : ""}`}
            aria-disabled={accounts.length < 2}
            onClick={(e) => accounts.length < 2 && e.preventDefault()}
          >
            <Icon name="plus" size={15} />
            Create Copier Link
          </Link>
        </div>
      </div>
      {copiers.length === 0 ? (
        <div className="card">
          <EmptyHint icon="branch" title="No copier links yet">
            {accounts.length < 2
              ? "Link at least two accounts to build a pipeline."
              : "Create your first master → follower pipeline."}
          </EmptyHint>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden", overflowX: "auto" }}>
          <table className="tbl" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                {[
                  "Copier Label",
                  "Master Source",
                  "Follower Target",
                  "Allocation",
                  "Active Rules",
                  "Max Age",
                  "Status",
                  "",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {copiers.map((c) => {
                const m = accById(c.master_account_id);
                const f = accById(c.follower_account_id);
                const alloc =
                  c.risk_mode === "multiplier"
                    ? `Multiplier: ${c.multiplier.toFixed(2)}x`
                    : `Fixed: ${c.fixed_lot_size.toFixed(2)} lots`;
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.label}</td>
                    <td>
                      <div className="label-stack">
                        <span className="lab">
                          {m
                            ? accountDisplayName(m.account_label, m.account_number).split(" — ")[0]
                            : "—"}
                        </span>
                        <span className="id">{m?.account_number ?? ""}</span>
                      </div>
                    </td>
                    <td>
                      <div className="label-stack">
                        <span className="lab">
                          {f
                            ? accountDisplayName(f.account_label, f.account_number).split(" — ")[0]
                            : "—"}
                        </span>
                        <span className="id">{f?.account_number ?? ""}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-plain">{alloc}</span>
                    </td>
                    <td>
                      <RuleIcons
                        rules={{
                          sl: c.copy_sl,
                          tp: c.copy_tp,
                          close: c.copy_closes,
                          modify: c.copy_modifications,
                        }}
                      />
                    </td>
                    <td className="num">{c.max_signal_age_ms} ms</td>
                    <td>
                      <span className={`badge badge-${c.is_enabled ? "ok" : "muted"}`}>
                        {c.is_enabled ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td>
                      <div className="row gap8" style={{ justifyContent: "flex-end" }}>
                        <Tip text={c.is_enabled ? "Suspend route" : "Resume route"}>
                          <Toggle on={c.is_enabled} onChange={() => toggle(c)} />
                        </Tip>
                        <Kebab
                          items={[
                            {
                              label: "Edit Pipeline",
                              icon: "edit",
                              onClick: () => router.push(`/copiers/${c.id}`),
                            },
                            { label: "View Logs", icon: "logs", onClick: () => router.push("/logs") },
                            { sep: true },
                            {
                              label: "Delete Link",
                              icon: "trash",
                              danger: true,
                              onClick: () => setConfirmDel(c),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {confirmDel && (
        <ConfirmModal
          title={`Delete ${confirmDel.label}?`}
          confirmWord="DELETE"
          confirmLabel="Delete copier"
          body="This removes the routing pipeline. Open positions already copied are not affected."
          onCancel={() => setConfirmDel(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

export function CopierFormPage({ copierId }: { copierId?: string }) {
  const router = useRouter();
  const { accounts, accById, copiers, refreshAll, toast } = useApp();
  const getToken = useAccessToken();
  const existing = copierId ? copiers.find((c) => c.id === copierId) : undefined;

  const [label, setLabel] = useState("");
  const [masterId, setMasterId] = useState("");
  const [followerId, setFollowerId] = useState("");
  const [allocType, setAllocType] = useState<"multiplier" | "fixed_lot">("multiplier");
  const [mult, setMult] = useState(1.0);
  const [fixed, setFixed] = useState(0.1);
  const [rules, setRules] = useState({ sl: true, tp: true, close: true, modify: true });
  const [maxAge, setMaxAge] = useState(3000);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setLabel(existing.label ?? "");
      setMasterId(existing.master_account_id);
      setFollowerId(existing.follower_account_id);
      setAllocType(existing.risk_mode === "fixed_lot" ? "fixed_lot" : "multiplier");
      setMult(existing.multiplier);
      setFixed(existing.fixed_lot_size);
      setRules({
        sl: existing.copy_sl,
        tp: existing.copy_tp,
        close: existing.copy_closes,
        modify: existing.copy_modifications,
      });
      setMaxAge(existing.max_signal_age_ms);
    } else if (accounts[0]) {
      setMasterId(accounts[0].id);
      if (accounts[1]) setFollowerId(accounts[1].id);
    }
  }, [existing, accounts]);

  const conflict = masterId && masterId === followerId;
  const valid = label && masterId && followerId && !conflict;
  const master = accById(masterId);
  const follower = accById(followerId);
  const toggleRule = (k: keyof typeof rules) => setRules({ ...rules, [k]: !rules[k] });

  const save = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const body = {
        label,
        master_account_id: masterId,
        follower_account_id: followerId,
        risk_mode: allocType,
        multiplier: mult,
        fixed_lot_size: fixed,
        copy_sl: rules.sl,
        copy_tp: rules.tp,
        copy_closes: rules.close,
        copy_modifications: rules.modify,
        max_signal_age_ms: maxAge,
      };
      if (existing) await api.updateCopier(token, existing.id, body);
      else await api.createCopier(token, body);
      toast(existing ? "Copier updated" : "Copier path deployed", "ok");
      await refreshAll();
      router.push("/copiers");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "err");
    } finally {
      setSaving(false);
    }
  };

  const allocText =
    allocType === "multiplier"
      ? `${mult.toFixed(2)}x lot sizing`
      : `a fixed ${fixed.toFixed(2)} lots`;

  return (
    <div className="page-inner">
      <Link href="/copiers" className="link-action" style={{ color: "var(--muted)", marginBottom: 14 }}>
        <Icon name="chevronLeft" size={14} />
        Copier Links
      </Link>
      <h1 style={{ fontSize: 21, margin: "0 0 18px", letterSpacing: "-0.02em" }}>
        {existing ? "Edit Copier Pipeline" : "New Copier Pipeline"}
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, alignItems: "start" }}>
        <div className="card card-pad">
          <div className="field">
            <label>Copier label</label>
            <input
              className="inp"
              placeholder="e.g. Master → Follower"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="row gap12">
            <div className="field" style={{ flex: 1 }}>
              <label>Master source</label>
              <select
                className="sel"
                value={masterId}
                onChange={(e) => setMasterId(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {accountDisplayName(a.account_label, a.account_number)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Follower target</label>
              <select
                className="sel"
                value={followerId}
                onChange={(e) => setFollowerId(e.target.value)}
                style={conflict ? { borderColor: "var(--error)" } : undefined}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {accountDisplayName(a.account_label, a.account_number)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {conflict && (
            <div className="alert alert-crit" style={{ marginBottom: 16 }}>
              <span className="a-ico">
                <Icon name="alert" size={15} />
              </span>
              <div>
                <strong>Validation error. </strong>
                Master and follower must be distinct accounts.
              </div>
            </div>
          )}
          <div className="divider" />
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>
            Allocation model
          </label>
          <div className="radio-row" style={{ marginBottom: 14 }}>
            <div
              className={`radio-card${allocType === "multiplier" ? " sel" : ""}`}
              onClick={() => setAllocType("multiplier")}
            >
              <div className="rc-top">
                <span className="rc-mark" />
                Risk ratio multiplier
              </div>
              <div className="rc-desc">Scale follower lots by a factor of the master.</div>
            </div>
            <div
              className={`radio-card${allocType === "fixed_lot" ? " sel" : ""}`}
              onClick={() => setAllocType("fixed_lot")}
            >
              <div className="rc-top">
                <span className="rc-mark" />
                Fixed lot allocation
              </div>
              <div className="rc-desc">Every copied trade uses one fixed lot size.</div>
            </div>
          </div>
          {allocType === "multiplier" ? (
            <div className="field" style={{ maxWidth: 220 }}>
              <label>Multiplier</label>
              <div className="row gap8">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMult(Math.max(0.01, +(mult - 0.1).toFixed(2)))}
                >
                  <Icon name="minus" size={14} />
                </button>
                <input
                  className="inp mono"
                  style={{ textAlign: "center" }}
                  value={`${mult.toFixed(2)}x`}
                  readOnly
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMult(+(mult + 0.1).toFixed(2))}
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="field" style={{ maxWidth: 220 }}>
              <label>Fixed lot size</label>
              <div className="inp-wrap">
                <input
                  className="inp mono"
                  value={fixed}
                  onChange={(e) => setFixed(Math.max(0.01, +e.target.value || 0.01))}
                  type="number"
                  step={0.01}
                />
                <span className="inp-suffix">lots</span>
              </div>
            </div>
          )}
          <div className="divider" />
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>
            Event sync boundaries
          </label>
          {(
            [
              ["sl", "Copy stop-loss protection"],
              ["tp", "Copy take-profit boundaries"],
              ["close", "Process manual order liquidations"],
              ["modify", "Replicate order amendments"],
            ] as const
          ).map(([k, lbl]) => (
            <div
              key={k}
              className="row spread"
              style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}
            >
              <span style={{ fontSize: 13 }}>{lbl}</span>
              <Toggle on={rules[k]} onChange={() => toggleRule(k)} />
            </div>
          ))}
          <div className="field" style={{ marginTop: 18, marginBottom: 0, maxWidth: 260 }}>
            <label>Max signal age limit</label>
            <div className="inp-wrap">
              <input
                className="inp mono"
                value={maxAge}
                onChange={(e) => setMaxAge(Math.max(100, +e.target.value || 3000))}
                type="number"
              />
              <span className="inp-suffix">ms</span>
            </div>
            <div className="hint">
              Signals older than this skip copying to safeguard execution from stale prices.
            </div>
          </div>
        </div>
        <div className="card" style={{ background: "var(--panel)", position: "sticky", top: 0 }}>
          <div className="card-head" style={{ background: "transparent" }}>
            <Icon name="gauge" size={16} style={{ color: "var(--accent)" }} />
            <h3>Pipeline Simulation</h3>
          </div>
          <div style={{ padding: 18 }}>
            <div className="node master">
              <div className="n-role">Master Source</div>
              <div className="n-name">
                {master
                  ? accountDisplayName(master.account_label, master.account_number)
                  : "Select master"}
              </div>
              <div className="n-id mono">{master?.account_number ?? ""}</div>
            </div>
            <div className="pipe-arrow">
              <Icon name="chevronDown" size={18} />
              <span className="lbl">
                {allocType === "multiplier"
                  ? `${mult.toFixed(2)}x`
                  : `${fixed.toFixed(2)} lots`}
              </span>
              <Icon name="chevronDown" size={18} />
            </div>
            <div className="node follower">
              <div className="n-role">Follower Target</div>
              <div className="n-name">
                {conflict
                  ? "— invalid —"
                  : follower
                    ? accountDisplayName(follower.account_label, follower.account_number)
                    : "Select follower"}
              </div>
              <div className="n-id mono">{conflict ? "" : (follower?.account_number ?? "")}</div>
            </div>
            <div className="divider" />
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--dark)" }}>
              Any market event on the master copies onto the follower at{" "}
              <strong>{allocText}</strong>, within a{" "}
              <span className="mono">{maxAge}ms</span> window.
            </div>
          </div>
        </div>
      </div>
      <div className="row gap10" style={{ marginTop: 18, justifyContent: "flex-end" }}>
        <Link href="/copiers" className="btn btn-ghost">
          Cancel
        </Link>
        <button
          type="button"
          className="btn btn-dark"
          disabled={!valid || saving}
          onClick={save}
        >
          <Icon name="branch" size={14} />
          {saving ? "Saving…" : existing ? "Update Copier" : "Deploy Copier Path"}
        </button>
      </div>
    </div>
  );
}
