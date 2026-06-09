"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import {
  ConfirmModal,
  EmptyHint,
  Meter,
  Toggle,
} from "@/components/ui";
import { PageIntro } from "@/components/shell/PageIntro";
import { useApp, useAccessToken } from "@/components/shell/AppProvider";
import { accountDisplayName, fmtMoney } from "@/lib/format";
import * as api from "@/lib/data";
import type { RiskProfile } from "@/lib/types";

function TagField({
  label,
  kind,
  tags,
  onChange,
}: {
  label: string;
  kind: "allow" | "block";
  tags: string[];
  onChange: (t: string[]) => void;
}) {
  const [v, setV] = useState("");
  const add = () => {
    const t = v.trim().toUpperCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setV("");
  };
  return (
    <div className="field">
      <label>{label}</label>
      <div className="tags">
        {tags.map((t) => (
          <span key={t} className={`tag-chip ${kind}`}>
            {t}
            <span className="x" onClick={() => onChange(tags.filter((x) => x !== t))}>
              <Icon name="x" size={11} />
            </span>
          </span>
        ))}
        <input
          value={v}
          placeholder="Add symbol…"
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
      </div>
    </div>
  );
}

function NumField({
  label,
  prefix,
  suffix,
  value,
  onChange,
  step,
}: {
  label: string;
  prefix?: string;
  suffix?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="inp-wrap">
        {prefix && (
          <span
            style={{
              position: "absolute",
              left: 11,
              top: 10,
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--faint)",
            }}
          >
            {prefix}
          </span>
        )}
        <input
          className="inp mono"
          type="number"
          value={value}
          step={step || 1}
          onChange={(e) => onChange(+e.target.value || 0)}
          style={{ paddingLeft: prefix ? 26 : 11 }}
        />
        {suffix && <span className="inp-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

function Panel({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>{title}</h3>
          {sub && (
            <div className="faint" style={{ fontSize: 11 }}>
              {sub}
            </div>
          )}
        </div>
      </div>
      <div className="card-pad">{children}</div>
    </div>
  );
}

export default function RiskPage() {
  const { accounts, riskProfiles } = useApp();

  return (
    <div className="page-inner">
      <PageIntro description="Daily loss caps, symbol filters, and lockouts on each follower account." />
      {accounts.length === 0 ? (
        <div className="card">
          <EmptyHint icon="shield" title="No accounts to guard">
            Link an account to configure risk rules.
          </EmptyHint>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden", overflowX: "auto" }}>
          <table className="tbl" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                {[
                  "Account",
                  "Daily Loss",
                  "Drawdown Cap",
                  "Equity Floor",
                  "Max Lots",
                  "Guard State",
                  "",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const r = riskProfiles.find((p) => p.account_id === a.id);
                const dailyLoss = r?.max_daily_loss ?? 0;
                const used = r?.daily_loss_accumulated ?? 0;
                const pct = dailyLoss > 0 ? Math.round((used / dailyLoss) * 100) : 0;
                return (
                  <tr key={a.id}>
                    <td>
                      <div className="label-stack">
                        <span className="lab">
                          {accountDisplayName(a.account_label, a.account_number)}
                        </span>
                        <span className="id">
                          {a.broker_server} · {a.account_number}
                        </span>
                      </div>
                    </td>
                    <td style={{ minWidth: 180 }}>
                      <div
                        className="row spread"
                        style={{ fontSize: 11.5, marginBottom: 4 }}
                      >
                        <span className="mono">{fmtMoney(used)}</span>
                        <span className="mono faint">/ {fmtMoney(dailyLoss)}</span>
                      </div>
                      <Meter pct={pct} />
                    </td>
                    <td className="num">{fmtMoney(r?.max_total_loss ?? 0)}</td>
                    <td className="num">{fmtMoney(r?.min_equity ?? 0)}</td>
                    <td className="num">{(r?.max_lot_per_trade ?? 0).toFixed(2)}</td>
                    <td>
                      {r?.is_locked ? (
                        <span className="badge badge-err">
                          <span className="bdot" />
                          Locked
                        </span>
                      ) : r ? (
                        <span className="badge badge-accent">
                          <Icon name="shield" size={11} />
                          Active Guard
                        </span>
                      ) : (
                        <span className="badge badge-muted">Not configured</span>
                      )}
                    </td>
                    <td>
                      <Link href={`/risk/${a.id}`} className="link-action">
                        Configure
                        <Icon name="chevronRight" size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function RiskDetailPage({ accountId }: { accountId: string }) {
  const { accById, riskByAccountId, refreshAll, toast } = useApp();
  const getToken = useAccessToken();
  const a = accById(accountId);
  const [profile, setProfile] = useState<RiskProfile | null>(null);
  const [flatten, setFlatten] = useState(false);
  const [unlock, setUnlock] = useState(false);
  const [saving, setSaving] = useState(false);

  const existing = riskByAccountId(accountId);

  useEffect(() => {
    if (existing) setProfile({ ...existing });
  }, [existing]);

  if (!a) {
    return (
      <div className="page-inner">
        <EmptyHint icon="shield" title="Account not found" />
      </div>
    );
  }

  const r = profile ?? existing ?? {
    id: "",
    user_id: "",
    account_id: accountId,
    max_daily_loss: 1000,
    max_total_loss: 2500,
    min_equity: 0,
    max_lot_per_trade: 1,
    max_open_positions: 10,
    max_trades_per_day: 30,
    allowed_symbols: [],
    blocked_symbols: [],
    news_pause_enabled: false,
    lock_after_loss: true,
    auto_flatten_enabled: true,
    is_locked: false,
    locked_reason: null,
    locked_at: null,
    daily_loss_accumulated: 0,
    daily_trades_count: 0,
    created_at: new Date().toISOString(),
  };

  const locked = r.is_locked;
  const setR = (patch: Partial<RiskProfile>) =>
    setProfile({ ...(profile ?? r), ...patch } as RiskProfile);

  const save = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const body = {
        max_daily_loss: r.max_daily_loss,
        max_total_loss: r.max_total_loss,
        min_equity: r.min_equity,
        max_lot_per_trade: r.max_lot_per_trade,
        max_open_positions: r.max_open_positions,
        max_trades_per_day: r.max_trades_per_day,
        allowed_symbols: r.allowed_symbols ?? [],
        blocked_symbols: r.blocked_symbols ?? [],
        lock_after_loss: r.lock_after_loss,
        auto_flatten_enabled: r.auto_flatten_enabled,
      };
      if (existing?.id) await api.updateRiskProfile(token, existing.id, body);
      else
        await api.createRiskProfile(token, {
          account_id: accountId,
          ...body,
        });
      toast("Risk profile saved", "ok");
      await refreshAll();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "err");
    } finally {
      setSaving(false);
    }
  };

  const name = accountDisplayName(a.account_label, a.account_number);

  return (
    <div className="page-inner">
      <Link href="/risk" className="link-action" style={{ color: "var(--text-secondary)", marginBottom: 14 }}>
        <Icon name="chevronLeft" size={14} />
        Risk limits
      </Link>
      {locked && (
        <div
          className="alert alert-crit big"
          style={{ marginBottom: 18, flexDirection: "column" }}
        >
          <div className="row gap10" style={{ width: "100%" }}>
            <span className="a-ico">
              <Icon name="lock" size={18} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                CRITICAL LOCKOUT
              </div>
              <div>
                {r.locked_reason ?? "Risk limit breached."} Copy operations are suspended on this
                terminal.
              </div>
            </div>
          </div>
          <div className="row gap10" style={{ marginTop: 4, paddingLeft: 28 }}>
            <button
              type="button"
              className="btn btn-danger-ghost btn-sm"
              onClick={() => setUnlock(true)}
            >
              Unlock Guardrail Rules
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setFlatten(true)}
            >
              <Icon name="flame" size={14} />
              Flatten All Open Positions
            </button>
          </div>
        </div>
      )}
      <div className="page-head" style={{ alignItems: "center" }}>
        <div className="pt">
          <div className="row gap10">
            <h1 style={{ margin: 0 }}>{name}</h1>
            {locked ? (
              <span className="badge badge-err">
                <span className="bdot" />
                Locked
              </span>
            ) : (
              <span className="badge badge-accent">
                <Icon name="shield" size={11} />
                Active Guard
              </span>
            )}
          </div>
          <p className="desc" style={{ marginTop: 4 }}>
            Sentinel guardrails for <span className="mono">{a.account_number}</span>
          </p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-dark btn-sm" disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </div>
      <div
        className="grid-risk-form"
        style={{
          opacity: locked ? 0.55 : 1,
          pointerEvents: locked ? "none" : "auto",
        }}
      >
        <Panel title="Loss Limit Thresholds" sub="Hard caps on realized & floating loss">
          <NumField
            label="Max daily loss cap"
            prefix="$"
            value={r.max_daily_loss ?? 0}
            onChange={(v) => setR({ max_daily_loss: v })}
            step={50}
          />
          <NumField
            label="Max absolute drawdown ceiling"
            prefix="$"
            value={r.max_total_loss ?? 0}
            onChange={(v) => setR({ max_total_loss: v })}
            step={100}
          />
          <NumField
            label="Minimum equity floor stop"
            prefix="$"
            value={r.min_equity ?? 0}
            onChange={(v) => setR({ min_equity: v })}
            step={500}
          />
        </Panel>
        <Panel title="Volume & Exposure Limits" sub="Per-ticket and aggregate caps">
          <NumField
            label="Max lots per trade ticket"
            value={r.max_lot_per_trade ?? 0}
            onChange={(v) => setR({ max_lot_per_trade: v })}
            step={0.1}
            suffix="lots"
          />
          <NumField
            label="Max open positions"
            value={r.max_open_positions ?? 10}
            onChange={(v) => setR({ max_open_positions: v })}
          />
          <NumField
            label="Max daily order frequency"
            value={r.max_trades_per_day ?? 30}
            onChange={(v) => setR({ max_trades_per_day: v })}
            suffix="/ day"
          />
        </Panel>
        <Panel title="Symbol Whitelist & Blacklist" sub="Filter which instruments may copy">
          <TagField
            label="Whitelist (allow only)"
            kind="allow"
            tags={r.allowed_symbols ?? []}
            onChange={(t) => setR({ allowed_symbols: t })}
          />
          <TagField
            label="Blacklist (always block)"
            kind="block"
            tags={r.blocked_symbols ?? []}
            onChange={(t) => setR({ blocked_symbols: t })}
          />
        </Panel>
        <Panel title="Sentinel Remediation" sub="Automated response on breach">
          <div
            className="row spread"
            style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Enforce lockout after breach</div>
              <div className="faint" style={{ fontSize: 11.5 }}>
                Suspend copying until manually cleared.
              </div>
            </div>
            <Toggle
              on={r.lock_after_loss}
              onChange={(v) => setR({ lock_after_loss: v })}
            />
          </div>
          <div className="row spread" style={{ padding: "10px 0" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Auto-flatten on breach</div>
              <div className="faint" style={{ fontSize: 11.5 }}>
                Close all open positions immediately.
              </div>
            </div>
            <Toggle
              on={r.auto_flatten_enabled}
              onChange={(v) => setR({ auto_flatten_enabled: v })}
              lime
            />
          </div>
        </Panel>
      </div>
      {unlock && existing && (
        <ConfirmModal
          title="Unlock guardrail rules?"
          confirmWord="UNLOCK"
          confirmLabel="Unlock node"
          danger={false}
          body="This re-enables copy operations on a node that breached its daily loss limit."
          onCancel={() => setUnlock(false)}
          onConfirm={async () => {
            const token = await getToken();
            if (!token) return;
            await api.unlockRiskProfile(token, existing.id);
            toast("Guardrails unlocked", "ok");
            setUnlock(false);
            await refreshAll();
          }}
        />
      )}
      {flatten && existing && (
        <ConfirmModal
          title="Flatten all open positions?"
          confirmWord="FLATTEN"
          confirmLabel="Flatten everything"
          body="This sends market-close orders for every open position on this terminal."
          onCancel={() => setFlatten(false)}
          onConfirm={async () => {
            const token = await getToken();
            if (!token) return;
            await api.flattenRiskProfile(token, existing.id);
            toast("Flatten order dispatched to worker", "ok");
            setFlatten(false);
          }}
        />
      )}
    </div>
  );
}
