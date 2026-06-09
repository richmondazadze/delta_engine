"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { PlatformBadge } from "@/components/PlatformIcon";
import { useApp, useAccessToken } from "@/components/shell/AppProvider";
import { ConfirmModal, EmptyHint, Seg, Toggle } from "@/components/ui";
import { accountDisplayName } from "@/lib/format";
import { accountOptionLabel, crossPlatformCopyHint } from "@/lib/platform-capabilities";
import * as api from "@/lib/data";
import type { Account } from "@/lib/types";
import type { SymbolMapping } from "@/lib/data";

const PRESETS: { master: string; follower: string; label: string }[] = [
  { master: "XAUUSD", follower: "GOLD", label: "Gold" },
  { master: "EURUSD", follower: "EURUSDm", label: "EUR suffix" },
  { master: "US30", follower: "DJ30", label: "Index" },
];

type ScopeFilter = "all" | "global" | "scoped" | "inactive";

function accountById(accounts: Account[], id: string | null | undefined) {
  if (!id) return null;
  return accounts.find((a) => a.id === id) ?? null;
}

function ScopeCell({
  row,
  accounts,
}: {
  row: SymbolMapping;
  accounts: Account[];
}) {
  const master = accountById(accounts, row.master_account_id);
  const follower = accountById(accounts, row.follower_account_id);

  if (!master && !follower) {
    return <span className="badge badge-muted">Global</span>;
  }

  return (
    <div className="sym-map-scope">
      {master ? (
        <span className="sym-map-scope-line" title={accountDisplayName(master.account_label, master.account_number)}>
          <PlatformBadge platformId={master.platform} size="xs" />
          <span className="truncate">
            {accountDisplayName(master.account_label, master.account_number)}
          </span>
        </span>
      ) : (
        <span className="faint">Any master</span>
      )}
      <Icon name="arrowRight" size={12} className="sym-map-scope-arrow" />
      {follower ? (
        <span className="sym-map-scope-line" title={accountDisplayName(follower.account_label, follower.account_number)}>
          <PlatformBadge platformId={follower.platform} size="xs" />
          <span className="truncate">
            {accountDisplayName(follower.account_label, follower.account_number)}
          </span>
        </span>
      ) : (
        <span className="faint">Any follower</span>
      )}
    </div>
  );
}

export function SymbolMappingsPanel() {
  const { accounts, toast, refreshAll } = useApp();
  const getToken = useAccessToken();
  const [rows, setRows] = useState<SymbolMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [masterSym, setMasterSym] = useState("");
  const [followerSym, setFollowerSym] = useState("");
  const [masterAcc, setMasterAcc] = useState("");
  const [followerAcc, setFollowerAcc] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [showAdd, setShowAdd] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMaster, setEditMaster] = useState("");
  const [editFollower, setEditFollower] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const data = await api.fetchSymbolMappings(token);
    setRows(data);
  }, [getToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Refresh failed", "err");
    } finally {
      setRefreshing(false);
    }
  };

  const masterPick = accountById(accounts, masterAcc || null);
  const followerPick = accountById(accounts, followerAcc || null);
  const crossHint = crossPlatformCopyHint(masterPick?.platform, followerPick?.platform);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return rows.filter((r) => {
      if (scopeFilter === "global" && (r.master_account_id || r.follower_account_id)) return false;
      if (scopeFilter === "scoped" && !r.master_account_id && !r.follower_account_id) return false;
      if (scopeFilter === "inactive" && r.is_active) return false;
      if (!q) return true;
      return (
        r.master_symbol.includes(q) ||
        r.follower_symbol.includes(q) ||
        accountById(accounts, r.master_account_id)?.account_label?.toUpperCase().includes(q) ||
        accountById(accounts, r.follower_account_id)?.account_label?.toUpperCase().includes(q)
      );
    });
  }, [rows, search, scopeFilter, accounts]);

  const activeCount = rows.filter((r) => r.is_active).length;

  const add = async () => {
    if (!masterSym.trim() || !followerSym.trim()) {
      toast("Enter both symbol names", "err");
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      await api.createSymbolMapping(token, {
        master_symbol: masterSym.trim(),
        follower_symbol: followerSym.trim(),
        master_account_id: masterAcc || undefined,
        follower_account_id: followerAcc || undefined,
      });
      toast("Symbol mapping saved", "ok");
      setMasterSym("");
      setFollowerSym("");
      await load();
      await refreshAll();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "err");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row: SymbolMapping) => {
    setEditingId(row.id);
    setEditMaster(row.master_symbol);
    setEditFollower(row.follower_symbol);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditMaster("");
    setEditFollower("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editMaster.trim() || !editFollower.trim()) {
      toast("Both symbols are required", "err");
      return;
    }
    setEditSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      await api.updateSymbolMapping(token, editingId, {
        master_symbol: editMaster.trim(),
        follower_symbol: editFollower.trim(),
      });
      toast("Mapping updated", "ok");
      cancelEdit();
      await load();
      await refreshAll();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed", "err");
    } finally {
      setEditSaving(false);
    }
  };

  const toggleActive = async (row: SymbolMapping) => {
    setTogglingId(row.id);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      await api.updateSymbolMapping(token, row.id, { is_active: !row.is_active });
      await load();
      await refreshAll();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed", "err");
    } finally {
      setTogglingId(null);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      await api.deleteSymbolMapping(token, deleteId);
      toast("Mapping removed", "ok");
      setDeleteId(null);
      if (editingId === deleteId) cancelEdit();
      await load();
      await refreshAll();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed", "err");
    }
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setMasterSym(preset.master);
    setFollowerSym(preset.follower);
  };

  return (
    <>
      <div className="card sym-map-card">
        <div className="card-head row spread sym-map-head">
          <div className="row gap10" style={{ alignItems: "flex-start" }}>
            <Icon name="git" size={16} style={{ color: "var(--accent)", marginTop: 2 }} />
            <div>
              <h3>Symbol mappings</h3>
              <p className="sub" style={{ margin: "4px 0 0", maxWidth: 520 }}>
                Translate symbol names between brokers (e.g. XAUUSD → GOLD.m). Leave accounts blank
                for a workspace-wide rule, or scope to a specific master → follower pair.
              </p>
            </div>
          </div>
          <div className="row gap8">
            <span className="badge badge-plain sym-map-count">
              {activeCount} active · {rows.length} total
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={refresh}
              disabled={refreshing}
              aria-label="Refresh mappings"
            >
              <Icon name="refresh" size={14} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="sym-map-toolbar">
          <div className="inp-wrap sym-map-search">
            <Icon name="search" size={14} style={{ position: "absolute", left: 11, top: 10, color: "var(--faint)" }} />
            <input
              className="inp"
              style={{ paddingLeft: 32 }}
              placeholder="Search symbols or account…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Seg
            options={[
              { value: "all", label: "All" },
              { value: "global", label: "Global" },
              { value: "scoped", label: "Scoped" },
              { value: "inactive", label: "Inactive" },
            ]}
            value={scopeFilter}
            onChange={(v) => setScopeFilter(v as ScopeFilter)}
          />
          <button
            type="button"
            className={`btn btn-ghost btn-sm${showAdd ? " on" : ""}`}
            onClick={() => setShowAdd((v) => !v)}
          >
            <Icon name="plus" size={14} />
            {showAdd ? "Hide form" : "Add mapping"}
          </button>
        </div>

        {showAdd && (
          <div className="sym-map-add">
            {accounts.length === 0 ? (
              <div className="alert alert-info" style={{ marginBottom: 0 }}>
                <span className="a-ico">
                  <Icon name="info" size={16} />
                </span>
                <div>
                  <strong>Link accounts first. </strong>
                  Symbol mappings can be global, but you need at least one terminal to scope rules
                  to a copy path.
                </div>
              </div>
            ) : (
              <>
                <div className="grid-risk-form">
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Master account (optional)</label>
                    <select
                      className="sel"
                      value={masterAcc}
                      onChange={(e) => setMasterAcc(e.target.value)}
                      aria-label="Master account"
                    >
                      <option value="">All masters</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {accountOptionLabel(a.account_label, a.account_number, a.platform)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Follower account (optional)</label>
                    <select
                      className="sel"
                      value={followerAcc}
                      onChange={(e) => setFollowerAcc(e.target.value)}
                      aria-label="Follower account"
                    >
                      <option value="">All followers</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {accountOptionLabel(a.account_label, a.account_number, a.platform)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {crossHint && (
                  <div className="alert alert-info" style={{ marginTop: 14, marginBottom: 0 }}>
                    <span className="a-ico">
                      <Icon name="info" size={16} />
                    </span>
                    <div>{crossHint}</div>
                  </div>
                )}

                <div className="grid-risk-form" style={{ marginTop: 14 }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Master symbol</label>
                    <input
                      className="inp mono"
                      placeholder="EURUSD"
                      value={masterSym}
                      onChange={(e) => setMasterSym(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void add();
                        }
                      }}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Follower symbol</label>
                    <input
                      className="inp mono"
                      placeholder="EURUSDm"
                      value={followerSym}
                      onChange={(e) => setFollowerSym(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void add();
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="sym-map-presets">
                  <span className="faint" style={{ fontSize: 11.5 }}>
                    Quick fill:
                  </span>
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className="sym-map-preset-chip"
                      onClick={() => applyPreset(p)}
                    >
                      {p.master} → {p.follower}
                    </button>
                  ))}
                </div>

                <div className="row gap10" style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={saving}
                    onClick={add}
                  >
                    {saving ? "Saving…" : "Add mapping"}
                  </button>
                  <span className="faint" style={{ fontSize: 12 }}>
                    Symbols are stored uppercase. Worker reloads mappings within ~5 seconds.
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {loading ? (
          <p className="faint sym-map-empty">Loading mappings…</p>
        ) : filtered.length === 0 ? (
          <div className="sym-map-empty">
            <EmptyHint
              icon="git"
              title={rows.length === 0 ? "No symbol mappings yet" : "No matches"}
            >
              {rows.length === 0
                ? "Add a rule when your master and follower brokers use different symbol names."
                : "Try a different search or filter."}
            </EmptyHint>
          </div>
        ) : (
          <>
            <div className="hide-mobile dash-table-wrap sym-map-table-wrap">
              <table className="dash-table sym-map-table">
                <thead>
                  <tr>
                    <th>Master symbol</th>
                    <th aria-hidden style={{ width: 28 }} />
                    <th>Follower symbol</th>
                    <th>Scope</th>
                    <th>Active</th>
                    <th style={{ width: 120 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const editing = editingId === r.id;
                    return (
                      <tr
                        key={r.id}
                        className={`dash-table-row sym-map-row${!r.is_active ? " inactive" : ""}`}
                      >
                        <td>
                          {editing ? (
                            <input
                              className="inp mono inp-compact"
                              value={editMaster}
                              onChange={(e) => setEditMaster(e.target.value.toUpperCase())}
                            />
                          ) : (
                            <span className="mono sym-map-symbol">{r.master_symbol}</span>
                          )}
                        </td>
                        <td className="sym-map-arrow-cell">
                          <Icon name="arrowRight" size={14} />
                        </td>
                        <td>
                          {editing ? (
                            <input
                              className="inp mono inp-compact"
                              value={editFollower}
                              onChange={(e) => setEditFollower(e.target.value.toUpperCase())}
                            />
                          ) : (
                            <span className="mono sym-map-symbol">{r.follower_symbol}</span>
                          )}
                        </td>
                        <td>
                          <ScopeCell row={r} accounts={accounts} />
                        </td>
                        <td>
                          <Toggle
                            on={r.is_active}
                            disabled={togglingId === r.id}
                            onChange={() => void toggleActive(r)}
                          />
                        </td>
                        <td>
                          <div className="row-actions">
                            {editing ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-row"
                                  disabled={editSaving}
                                  onClick={saveEdit}
                                >
                                  <Icon name="check" size={13} />
                                  Save
                                </button>
                                <button type="button" className="btn-row" onClick={cancelEdit}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="btn-row"
                                  aria-label="Edit mapping"
                                  onClick={() => startEdit(r)}
                                >
                                  <Icon name="edit" size={13} />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn-row danger"
                                  aria-label="Delete mapping"
                                  onClick={() => setDeleteId(r.id)}
                                >
                                  <Icon name="trash" size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="show-mobile-only sym-map-mobile">
              {filtered.map((r) => {
                const editing = editingId === r.id;
                return (
                  <div
                    key={r.id}
                    className={`sym-map-mobile-card${!r.is_active ? " inactive" : ""}`}
                  >
                    <div className="row spread" style={{ alignItems: "flex-start", gap: 10 }}>
                      <div className="sym-map-mobile-symbols">
                        {editing ? (
                          <div className="grid-risk-form" style={{ gap: 8 }}>
                            <input
                              className="inp mono"
                              value={editMaster}
                              onChange={(e) => setEditMaster(e.target.value.toUpperCase())}
                            />
                            <input
                              className="inp mono"
                              value={editFollower}
                              onChange={(e) => setEditFollower(e.target.value.toUpperCase())}
                            />
                          </div>
                        ) : (
                          <>
                            <span className="mono">{r.master_symbol}</span>
                            <Icon name="arrowRight" size={14} className="sym-map-scope-arrow" />
                            <span className="mono">{r.follower_symbol}</span>
                          </>
                        )}
                      </div>
                      <Toggle
                        on={r.is_active}
                        disabled={togglingId === r.id}
                        onChange={() => void toggleActive(r)}
                      />
                    </div>
                    <ScopeCell row={r} accounts={accounts} />
                    <div className="row-actions" style={{ marginTop: 10 }}>
                      {editing ? (
                        <>
                          <button
                            type="button"
                            className="btn-row"
                            disabled={editSaving}
                            onClick={saveEdit}
                          >
                            Save
                          </button>
                          <button type="button" className="btn-row" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="btn-row" onClick={() => startEdit(r)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-row danger"
                            onClick={() => setDeleteId(r.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {deleteId && (
        <ConfirmModal
          title="Remove symbol mapping?"
          confirmWord="REMOVE"
          confirmLabel="Remove mapping"
          body="Copies may fail or skip trades if master and follower symbol names no longer match."
          onCancel={() => setDeleteId(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}
