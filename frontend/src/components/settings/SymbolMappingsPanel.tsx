"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { useApp, useAccessToken } from "@/components/shell/AppProvider";
import * as api from "@/lib/data";
import type { SymbolMapping } from "@/lib/data";

export function SymbolMappingsPanel() {
  const { accounts, toast, refreshAll } = useApp();
  const getToken = useAccessToken();
  const [rows, setRows] = useState<SymbolMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterSym, setMasterSym] = useState("");
  const [followerSym, setFollowerSym] = useState("");
  const [masterAcc, setMasterAcc] = useState("");
  const [followerAcc, setFollowerAcc] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      setRows(await api.fetchSymbolMappings(token));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [getToken]);

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

  const remove = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      await api.deleteSymbolMapping(token, id);
      toast("Mapping removed", "ok");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed", "err");
    }
  };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>Symbol mappings</h3>
        <p className="muted" style={{ margin: "6px 0 0", fontSize: 12.5 }}>
          Map different symbol names between brokers (e.g. XAUUSD → GOLD.m). Leave accounts blank
          for a global rule.
        </p>
      </div>

      <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
        <div className="form-grid-2" style={{ gap: 10, marginBottom: 10 }}>
          <select
            className="input"
            value={masterAcc}
            onChange={(e) => setMasterAcc(e.target.value)}
            aria-label="Master account"
          >
            <option value="">All masters</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.account_label || a.account_number}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={followerAcc}
            onChange={(e) => setFollowerAcc(e.target.value)}
            aria-label="Follower account"
          >
            <option value="">All followers</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.account_label || a.account_number}
              </option>
            ))}
          </select>
        </div>
        <div className="form-grid-2" style={{ gap: 10 }}>
          <input
            className="input"
            placeholder="Master symbol (EURUSD)"
            value={masterSym}
            onChange={(e) => setMasterSym(e.target.value)}
          />
          <input
            className="input"
            placeholder="Follower symbol (EURUSDm)"
            value={followerSym}
            onChange={(e) => setFollowerSym(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{ marginTop: 12 }}
          disabled={saving}
          onClick={add}
        >
          {saving ? "Saving…" : "Add mapping"}
        </button>
      </div>

      {loading ? (
        <p className="faint" style={{ padding: 16, margin: 0, fontSize: 13 }}>
          Loading mappings…
        </p>
      ) : rows.length === 0 ? (
        <p className="faint" style={{ padding: 16, margin: 0, fontSize: 13 }}>
          No mappings yet — add one when master and follower use different symbol names.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Master</th>
                <th>Follower</th>
                <th>Scope</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.master_symbol}</td>
                  <td className="mono">{r.follower_symbol}</td>
                  <td className="faint" style={{ fontSize: 12 }}>
                    {r.master_account_id || r.follower_account_id ? "Account pair" : "Global"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      aria-label="Delete mapping"
                      onClick={() => remove(r.id)}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
