"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { ConfirmModal, EmptyHint, Toggle } from "@/components/ui";
import { useApp, useAccessToken } from "@/components/shell/AppProvider";
import { accountDisplayName, fmtMoney } from "@/lib/format";
import {
  accountOptionLabel,
  crossPlatformCopyHint,
} from "@/lib/platform-capabilities";
import {
  copierEngineStats,
  groupCopiersByMaster,
  riskAllocationDisplay,
} from "@/lib/copier-engine";
import * as api from "@/lib/data";
import type { Account, Copier } from "@/lib/types";
import { PlatformBadge } from "@/components/PlatformIcon";

function accountShortName(a: Account | undefined) {
  if (!a) return "—";
  return accountDisplayName(a.account_label, a.account_number);
}

function SummaryStrip({
  portfolioValue,
  masters,
  followers,
  active,
}: {
  portfolioValue: number | null;
  masters: number;
  followers: number;
  active: number;
}) {
  return (
    <div className="summary-strip">
      <div className="summary-stat">
        <div className="ss-label">Portfolio value</div>
        <div className="ss-value">{portfolioValue != null ? fmtMoney(portfolioValue) : "—"}</div>
        <div className="ss-sub">Combined account equity</div>
      </div>
      <div className="summary-stat">
        <div className="ss-label">Masters</div>
        <div className="ss-value">{masters}</div>
        <div className="ss-sub">Accounts you copy from</div>
      </div>
      <div className="summary-stat">
        <div className="ss-label">Followers</div>
        <div className="ss-value">{followers}</div>
        <div className="ss-sub">Accounts receiving copies</div>
      </div>
      <div className="summary-stat">
        <div className="ss-label">Active links</div>
        <div className="ss-value">{active}</div>
        <div className="ss-sub">Copying right now</div>
      </div>
    </div>
  );
}

function FollowerRow({
  c,
  master,
  masterName,
  follower,
  onToggle,
  onEdit,
  onDelete,
}: {
  c: Copier;
  master: Account | undefined;
  masterName: string;
  follower: Account | undefined;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const risk = riskAllocationDisplay(c);

  return (
    <tr className="follower-row">
      <td>
        <span className="badge badge-follower">Follower</span>
      </td>
      <td>
        <div className="label-stack">
          <span className="lab">{c.label || accountShortName(follower)}</span>
          <span className="id">{follower?.account_number ?? "—"}</span>
        </div>
      </td>
      <td>
        <div className="row gap6">
          <span>{masterName}</span>
          {master && <PlatformBadge platformId={master.platform} size="md" />}
        </div>
      </td>
      <td>{risk.type}</td>
      <td className="mono">{risk.setting}</td>
      <td>
        <Toggle on={c.is_enabled} onChange={onToggle} />
      </td>
      <td>
        <div className="row-actions">
          <button type="button" className="btn-row" onClick={onEdit}>
            <Icon name="edit" size={13} />
            Edit
          </button>
          <button type="button" className="btn-row" onClick={onToggle}>
            <Icon name={c.is_enabled ? "stop" : "play"} size={13} />
            {c.is_enabled ? "Pause" : "Resume"}
          </button>
          <button type="button" className="btn-row danger" onClick={onDelete}>
            <Icon name="trash" size={13} />
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function MasterGroupBlock({
  group,
  expanded,
  onToggleExpand,
  onToggleMaster,
  onToggleCopier,
  onEdit,
  onDelete,
  accById,
}: {
  group: ReturnType<typeof groupCopiersByMaster>[number];
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleMaster: () => void;
  onEdit: (c: Copier) => void;
  onDelete: (c: Copier) => void;
  onToggleCopier: (c: Copier) => void;
  accById: (id: string) => Account | undefined;
}) {
  const masterName = accountShortName(group.master);

  return (
    <>
        <tr className={`master-row${expanded ? " is-expanded" : ""}`}>
        <td>
          <button
            type="button"
            className={`expand-btn${expanded ? " open" : ""}`}
            onClick={onToggleExpand}
            aria-label={expanded ? "Collapse followers" : "Expand followers"}
          >
            <Icon name="chevronRight" size={14} />
          </button>
        </td>
        <td>
          <span className="badge badge-master">Master</span>
        </td>
        <td colSpan={2}>
          <div className="row gap8">
            <span className="master-name">{masterName}</span>
            {group.master && <PlatformBadge platformId={group.master.platform} size="md" />}
          </div>
        </td>
        <td className="faint">{group.copiers.length} follower{group.copiers.length !== 1 ? "s" : ""}</td>
        <td>
          <Toggle on={group.anyEnabled} onChange={onToggleMaster} />
        </td>
        <td>
          <div className="row-actions">
            <Link
              href={`/copiers/new?master=${group.masterId}`}
              className="btn-row"
            >
              <Icon name="plus" size={13} />
              Add follower
            </Link>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="follower-group">
          <td colSpan={7}>
            <div className="follower-group-inner">
              <div className="follower-group-label">Follower accounts</div>
              <div className="follower-group-table-wrap">
              <table className="copier-engine-table copier-engine-table-nested">
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>Role</th>
                    <th>Setup</th>
                    <th>Copy from</th>
                    <th>Risk type</th>
                    <th>Size</th>
                    <th style={{ width: 70 }}>On</th>
                    <th style={{ width: 240 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.copiers.map((c) => (
                    <FollowerRow
                      key={c.id}
                      c={c}
                      master={group.master}
                      masterName={masterName}
                      follower={accById(c.follower_account_id)}
                      onToggle={() => onToggleCopier(c)}
                      onEdit={() => onEdit(c)}
                      onDelete={() => onDelete(c)}
                    />
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function CopierMobileList({
  groups,
  accById,
  onToggleMaster,
  onToggleCopier,
  onEdit,
  onDelete,
}: {
  groups: ReturnType<typeof groupCopiersByMaster>;
  accById: (id: string) => Account | undefined;
  onToggleMaster: (g: (typeof groups)[number]) => void;
  onToggleCopier: (c: Copier) => void;
  onEdit: (c: Copier) => void;
  onDelete: (c: Copier) => void;
}) {
  return (
    <div className="copier-mobile-list">
      {groups.map((group) => {
        const masterName = accountShortName(group.master);
        return (
          <div key={group.masterId} className="copier-mobile-master">
            <div className="copier-mobile-master-head">
              <div className="row spread" style={{ marginBottom: 10 }}>
                <div className="row gap8">
                  <span className="badge badge-master">Master</span>
                  {group.master && <PlatformBadge platformId={group.master.platform} size="md" />}
                </div>
                <Toggle on={group.anyEnabled} onChange={() => onToggleMaster(group)} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{masterName}</div>
              <div className="row gap8">
                <Link
                  href={`/copiers/new?master=${group.masterId}`}
                  className="btn btn-ghost btn-sm"
                >
                  <Icon name="plus" size={13} />
                  Add follower
                </Link>
                <span className="faint" style={{ fontSize: 12 }}>
                  {group.copiers.length} follower{group.copiers.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="copier-mobile-followers">
              {group.copiers.map((c) => {
                const follower = accById(c.follower_account_id);
                const risk = riskAllocationDisplay(c);
                return (
                  <div key={c.id} className="copier-mobile-follower">
                    <div className="row spread" style={{ marginBottom: 8 }}>
                      <span className="badge badge-follower">Follower</span>
                      <Toggle on={c.is_enabled} onChange={() => onToggleCopier(c)} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>
                      {c.label || accountShortName(follower)}
                    </div>
                    <div className="faint mono" style={{ fontSize: 11, marginBottom: 8 }}>
                      {follower?.account_number}
                    </div>
                    <dl className="copier-mobile-meta">
                      <div>
                        <dt>Risk</dt>
                        <dd>{risk.type}</dd>
                      </div>
                      <div>
                        <dt>Size</dt>
                        <dd>{risk.setting}</dd>
                      </div>
                    </dl>
                    <div className="row-actions">
                      <button type="button" className="btn-row" onClick={() => onEdit(c)}>
                        Edit
                      </button>
                      <button type="button" className="btn-row" onClick={() => onToggleCopier(c)}>
                        {c.is_enabled ? "Pause" : "Resume"}
                      </button>
                      <button type="button" className="btn-row danger" onClick={() => onDelete(c)}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CopiersPage() {
  const router = useRouter();
  const { accounts, copiers, accById, dashboard, refreshAll, toast } = useApp();
  const getToken = useAccessToken();
  const [confirmDel, setConfirmDel] = useState<Copier | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const groups = useMemo(
    () => groupCopiersByMaster(copiers, accById),
    [copiers, accById],
  );

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const g of groups) next.add(g.masterId);
      return next;
    });
  }, [groups]);

  const stats = copierEngineStats(
    copiers,
    accounts,
    dashboard?.today?.total_equity,
  );

  const toggleCopier = async (c: Copier) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const wasEnabled = c.is_enabled;
      if (wasEnabled) await api.disableCopier(token, c.id);
      else await api.enableCopier(token, c.id);
      toast(wasEnabled ? "Copying paused" : "Copying resumed", "ok");
      await refreshAll();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not update setup", "err");
    }
  };

  const toggleMasterGroup = async (group: (typeof groups)[number]) => {
    const enable = !group.anyEnabled;
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      for (const c of group.copiers) {
        if (enable && !c.is_enabled) await api.enableCopier(token, c.id);
        if (!enable && c.is_enabled) await api.disableCopier(token, c.id);
      }
      toast(enable ? "All followers resumed" : "All followers paused", "ok");
      await refreshAll();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not update group", "err");
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await api.deleteCopier(token, confirmDel.id);
      toast("Copy setup removed", "ok");
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
          <h1>Copy engine</h1>
          <p className="desc">
            Manage master accounts and the followers that mirror their trades. Turn copying on or off anytime.
          </p>
        </div>
        <div className="actions">
          <Link
            href={accounts.length < 2 ? "#" : "/copiers/new"}
            className={`btn btn-accent${accounts.length < 2 ? " disabled" : ""}`}
            aria-disabled={accounts.length < 2}
            onClick={(e) => accounts.length < 2 && e.preventDefault()}
          >
            <Icon name="plus" size={15} />
            Add copy setup
          </Link>
        </div>
      </div>

      {copiers.length > 0 && (
        <SummaryStrip
          portfolioValue={stats.portfolioValue}
          masters={stats.masters}
          followers={stats.followers}
          active={stats.active}
        />
      )}

      {copiers.length === 0 ? (
        <div className="card">
          <EmptyHint icon="branch" title="No copy setups yet">
            {accounts.length < 2
              ? "Link at least two trading accounts, then connect a master to one or more followers."
              : "Add your first setup — pick a master account and the followers that should copy it."}
            {accounts.length >= 2 && (
              <>
                {" "}
                <Link href="/copiers/new">Create your first setup</Link>
              </>
            )}
          </EmptyHint>
        </div>
      ) : (
        <>
          <CopierMobileList
            groups={groups}
            accById={accById}
            onToggleMaster={toggleMasterGroup}
            onToggleCopier={toggleCopier}
            onEdit={(c) => router.push(`/copiers/${c.id}`)}
            onDelete={(c) => setConfirmDel(c)}
          />
          <div className="card copier-engine-card hide-mobile copier-engine-desktop">
          <div className="card-head">
            <Icon name="branch" size={16} style={{ color: "var(--accent)" }} />
            <h3>Trade copiers</h3>
            <span className="sub">· {copiers.length} link{copiers.length !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="copier-engine-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }} />
                  <th style={{ width: 90 }}>Role</th>
                  <th colSpan={2}>Account</th>
                  <th>Followers</th>
                  <th style={{ width: 70 }}>On</th>
                  <th style={{ width: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <MasterGroupBlock
                    key={group.masterId}
                    group={group}
                    expanded={expanded.has(group.masterId)}
                    onToggleExpand={() =>
                      setExpanded((s) => {
                        const n = new Set(s);
                        if (n.has(group.masterId)) n.delete(group.masterId);
                        else n.add(group.masterId);
                        return n;
                      })
                    }
                    onToggleMaster={() => toggleMasterGroup(group)}
                    onToggleCopier={toggleCopier}
                    accById={accById}
                    onEdit={(c) => router.push(`/copiers/${c.id}`)}
                    onDelete={(c) => setConfirmDel(c)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {confirmDel && (
        <ConfirmModal
          title={`Remove ${confirmDel.label || "this setup"}?`}
          confirmWord="DELETE"
          confirmLabel="Remove setup"
          body="This stops future copies on this link. Trades already copied stay on the follower account."
          onCancel={() => setConfirmDel(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

export function CopierFormPage({ copierId }: { copierId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetMaster = searchParams.get("master");
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
    } else if (accounts.length) {
      setMasterId(presetMaster && accById(presetMaster) ? presetMaster : accounts[0].id);
      const follower = accounts.find((a) => a.id !== (presetMaster || accounts[0].id));
      if (follower) setFollowerId(follower.id);
    }
  }, [existing, accounts, presetMaster, accById]);

  const conflict = masterId && masterId === followerId;
  const valid = label && masterId && followerId && !conflict;
  const master = accById(masterId);
  const follower = accById(followerId);
  const crossHint = crossPlatformCopyHint(master?.platform, follower?.platform);
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
      toast(existing ? "Copy setup saved" : "Copy setup created", "ok");
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
      ? `${mult.toFixed(2)}× the master's lot size`
      : `${fixed.toFixed(2)} lots on every copy`;

  return (
    <div className="page-inner">
      <Link href="/copiers" className="link-action" style={{ color: "var(--text-secondary)", marginBottom: 14 }}>
        <Icon name="chevronLeft" size={14} />
        Back to copy engine
      </Link>
      <h1 style={{ fontSize: 21, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
        {existing ? "Edit copy setup" : "New copy setup"}
      </h1>
      <p className="muted" style={{ margin: "0 0 18px", fontSize: 13.5 }}>
        Choose which account leads and which follows, then set how large each copied trade should be.
      </p>
      <div className="grid-form-two-col">
        <div className="card card-pad">
          <div className="field">
            <label>Setup name</label>
            <input
              className="inp"
              placeholder="e.g. Main → FTMO challenge"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="row gap12">
            <div className="field" style={{ flex: 1 }}>
              <label>Master account</label>
              <select
                className="sel"
                value={masterId}
                onChange={(e) => setMasterId(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {accountOptionLabel(a.account_label, a.account_number, a.platform)}
                  </option>
                ))}
              </select>
              {master && (
                <div className="hint" style={{ marginTop: 6 }}>
                  <PlatformBadge platformId={master.platform} size="md" />
                  <span style={{ marginLeft: 6 }}>Trades on this account are copied to followers.</span>
                </div>
              )}
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Follower account</label>
              <select
                className="sel"
                value={followerId}
                onChange={(e) => setFollowerId(e.target.value)}
                style={conflict ? { borderColor: "var(--error)" } : undefined}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {accountOptionLabel(a.account_label, a.account_number, a.platform)}
                  </option>
                ))}
              </select>
              {follower && (
                <div className="hint" style={{ marginTop: 6 }}>
                  <PlatformBadge platformId={follower.platform} size="md" />
                  <span style={{ marginLeft: 6 }}>Receives copied trades from the master.</span>
                </div>
              )}
            </div>
          </div>
          {crossHint && (
            <div className="alert alert-info" style={{ marginBottom: 14 }}>
              {crossHint}
            </div>
          )}
          {conflict && (
            <div className="alert alert-crit" style={{ marginBottom: 16 }}>
              <span className="a-ico">
                <Icon name="alert" size={15} />
              </span>
              <div>
                <strong>Pick two different accounts. </strong>
                Master and follower cannot be the same account.
              </div>
            </div>
          )}
          <div className="divider" />
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>
            How much to copy
          </label>
          <div className="radio-row" style={{ marginBottom: 14 }}>
            <div
              className={`radio-card${allocType === "multiplier" ? " sel" : ""}`}
              onClick={() => setAllocType("multiplier")}
            >
              <div className="rc-top">
                <span className="rc-mark" />
                Balance multiplier
              </div>
              <div className="rc-desc">Scale follower lots relative to the master trade.</div>
            </div>
            <div
              className={`radio-card${allocType === "fixed_lot" ? " sel" : ""}`}
              onClick={() => setAllocType("fixed_lot")}
            >
              <div className="rc-top">
                <span className="rc-mark" />
                Fixed lot size
              </div>
              <div className="rc-desc">Every copied trade uses the same lot size.</div>
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
              <label>Lot size</label>
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
            What to copy
          </label>
          {(
            [
              ["sl", "Stop loss"],
              ["tp", "Take profit"],
              ["close", "When master closes"],
              ["modify", "Changes to stops & targets"],
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
            <label>Max delay before skip</label>
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
              If a signal is older than this, it won&apos;t copy — helps avoid stale prices.
            </div>
          </div>
        </div>
        <div className="card card-preview" style={{ background: "var(--panel)" }}>
          <div className="card-head" style={{ background: "transparent" }}>
            <Icon name="branch" size={16} style={{ color: "var(--accent)" }} />
            <h3>Preview</h3>
          </div>
          <div style={{ padding: 18 }}>
            <div className="node master">
              <div className="n-role">Master</div>
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
              <div className="n-role">Follower</div>
              <div className="n-name">
                {conflict
                  ? "— pick another account —"
                  : follower
                    ? accountDisplayName(follower.account_label, follower.account_number)
                    : "Select follower"}
              </div>
              <div className="n-id mono">{conflict ? "" : (follower?.account_number ?? "")}</div>
            </div>
            <div className="divider" />
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--dark)" }}>
              When the master opens or closes a trade, the follower copies it at{" "}
              <strong>{allocText}</strong>.
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
          className="btn btn-accent"
          disabled={!valid || saving}
          onClick={save}
        >
          <Icon name="branch" size={14} />
          {saving ? "Saving…" : existing ? "Save setup" : "Create setup"}
        </button>
      </div>
    </div>
  );
}
