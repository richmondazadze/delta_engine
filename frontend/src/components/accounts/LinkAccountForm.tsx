"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { PlatformBadge } from "@/components/PlatformIcon";
import { useApp, useAccessToken } from "@/components/shell/AppProvider";
import { PLATFORM_CATALOG } from "@/lib/platforms";
import type { PlatformType } from "@/lib/types";
import {
  fetchDXtradeFirms,
  getDXtradeFirm,
  type DXtradeFirm,
} from "@/lib/dxtrade-firms";
import {
  fetchMT5Brokers,
  getMT5Broker,
  type MT5Broker,
} from "@/lib/mt5-brokers";
import * as api from "@/lib/data";

export function LinkAccountForm() {
  const router = useRouter();
  const { toast, refreshAll } = useApp();
  const getToken = useAccessToken();

  const [platform, setPlatform] = useState<PlatformType>("mt5");
  const [firmSlug, setFirmSlug] = useState("ftmo");
  const [brokerSlug, setBrokerSlug] = useState("moneta_markets");
  const [firms, setFirms] = useState<DXtradeFirm[]>([]);
  const [brokers, setBrokers] = useState<MT5Broker[]>([]);
  const [firmsLoading, setFirmsLoading] = useState(false);
  const [brokersLoading, setBrokersLoading] = useState(false);

  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [server, setServer] = useState("");
  const [customApiUrl, setCustomApiUrl] = useState("");
  const [customTerminalPath, setCustomTerminalPath] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [adv, setAdv] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedFirm = useMemo(
    () => getDXtradeFirm(firms, firmSlug),
    [firms, firmSlug],
  );
  const selectedBroker = useMemo(
    () => getMT5Broker(brokers, brokerSlug),
    [brokers, brokerSlug],
  );

  useEffect(() => {
    if (platform !== "dxtrade") return;
    setFirmsLoading(true);
    fetchDXtradeFirms()
      .then(setFirms)
      .catch(() => toast("Could not load DXtrade firms", "err"))
      .finally(() => setFirmsLoading(false));
  }, [platform, toast]);

  useEffect(() => {
    if (platform !== "mt5") return;
    setBrokersLoading(true);
    fetchMT5Brokers()
      .then(setBrokers)
      .catch(() => toast("Could not load MT5 brokers", "err"))
      .finally(() => setBrokersLoading(false));
  }, [platform, toast]);

  useEffect(() => {
    if (platform !== "dxtrade" || !selectedFirm || firmSlug === "custom") return;
    setServer(selectedFirm.default_domain);
    setCustomApiUrl(selectedFirm.api_base_url);
  }, [platform, selectedFirm, firmSlug]);

  useEffect(() => {
    if (platform !== "mt5" || !selectedBroker || brokerSlug === "custom") return;
    if (selectedBroker.default_server && !server) {
      setServer(selectedBroker.default_server);
    }
  }, [platform, selectedBroker, brokerSlug, server]);

  const valid = useMemo(() => {
    if (!name || !login || !pw) return false;
    if (platform === "mt5") {
      if (!server.trim()) return false;
      if (brokerSlug === "custom" && adv && !customTerminalPath.trim()) return false;
      return true;
    }
    if (platform === "dxtrade") {
      const domain = server.trim() || selectedFirm?.default_domain || "default";
      const base =
        firmSlug === "custom"
          ? customApiUrl.trim()
          : selectedFirm?.api_base_url || customApiUrl.trim();
      return Boolean(domain && base.startsWith("http"));
    }
    return false;
  }, [
    name,
    login,
    pw,
    platform,
    server,
    customApiUrl,
    firmSlug,
    brokerSlug,
    selectedFirm,
    adv,
    customTerminalPath,
  ]);

  const save = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      let created;
      if (platform === "mt5") {
        created = await api.createAccount(token, {
          platform: "mt5",
          account_number: login,
          broker_server: server.trim(),
          password: pw,
          account_label: name,
          broker_slug: brokerSlug,
          terminal_path:
            brokerSlug === "custom" && customTerminalPath.trim()
              ? customTerminalPath.trim()
              : undefined,
        });
      } else if (platform === "dxtrade") {
        const apiBase =
          firmSlug === "custom"
            ? customApiUrl.trim()
            : selectedFirm?.api_base_url || customApiUrl.trim();
        created = await api.createAccount(token, {
          platform: "dxtrade",
          account_number: login,
          broker_server: server.trim() || selectedFirm?.default_domain || "default",
          password: pw,
          account_label: name,
          api_base_url: apiBase,
          firm_slug: firmSlug,
        });
      } else {
        throw new Error("Platform not supported yet");
      }

      toast("Account saved — testing connection…", "ok");
      await refreshAll();

      try {
        const test = await api.testAccountConnection(token, created.id);
        const ok =
          test.status === "connected" ||
          test.status === "queued";
        toast(
          test.message || test.status || "Test complete",
          ok ? "ok" : "err",
        );
      } catch (e) {
        toast(e instanceof Error ? e.message : "Connection test failed", "err");
      }

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
      <Link href="/accounts" className="link-action" style={{ color: "var(--text-secondary)", marginBottom: 14 }}>
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
          Passwords are AES-256-GCM encrypted at rest and write-only.
        </div>
      </div>
      <div className="card card-pad">
        <div className="field">
          <label>Account friendly name</label>
          <input
            className="inp"
            placeholder="e.g. Moneta Demo Master"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Platform</label>
          <select
            className="sel"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as PlatformType)}
          >
            {PLATFORM_CATALOG.map((p) => (
              <option key={p.id} value={p.id} disabled={p.phase !== "live"}>
                {p.name}
                {p.phase === "live" ? "" : " — soon"}
              </option>
            ))}
          </select>
          <div className="hint" style={{ marginTop: 6 }}>
            <PlatformBadge platformId={platform} size="sm" />
            {platform === "dxtrade"
              ? " — web/API login (e.g. FTMO DXtrade). Same firm may also offer MT5 — pick the platform you trade on."
              : platform === "mt5"
                ? " — desktop terminal (Exness, Moneta, FTMO MT5, etc.). We auto-detect the broker app on this PC."
                : " — coming soon."}
          </div>
        </div>

        {platform === "mt5" && (
          <>
            <div className="field">
              <label>Broker</label>
              <select
                className="sel"
                value={brokerSlug}
                onChange={(e) => setBrokerSlug(e.target.value)}
                disabled={brokersLoading}
              >
                {brokers.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                    {b.terminal_installed ? " ✓" : ""}
                  </option>
                ))}
              </select>
              {selectedBroker?.notes && (
                <div className="hint" style={{ marginTop: 6 }}>
                  {selectedBroker.notes}
                </div>
              )}
              {selectedBroker && brokerSlug !== "custom" && (
                <div className="hint" style={{ marginTop: 4 }}>
                  {selectedBroker.terminal_installed ? (
                    <>
                      Terminal found:{" "}
                      <span className="mono" style={{ fontSize: 11 }}>
                        {selectedBroker.terminal_path}
                      </span>
                    </>
                  ) : (
                    <>
                      Install the {selectedBroker.name} MT5 app, then refresh this page.
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {platform === "dxtrade" && (
          <>
            <div className="field">
              <label>Prop firm / broker</label>
              <select
                className="sel"
                value={firmSlug}
                onChange={(e) => setFirmSlug(e.target.value)}
                disabled={firmsLoading}
              >
                {firms.map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {f.name}
                    {f.verified ? " ✓" : ""}
                  </option>
                ))}
              </select>
              {selectedFirm?.notes && (
                <div className="hint" style={{ marginTop: 6 }}>
                  {selectedFirm.notes}
                </div>
              )}
            </div>
            {firmSlug === "custom" && (
              <div className="field">
                <label>API base URL</label>
                <input
                  className="inp mono"
                  placeholder="https://your-broker.com"
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                />
              </div>
            )}
            {firmSlug !== "custom" && selectedFirm?.api_base_url && (
              <div className="field">
                <label>API host (preset)</label>
                <input className="inp mono" value={selectedFirm.api_base_url} readOnly disabled />
              </div>
            )}
          </>
        )}

        <div className="row gap12">
          <div className="field" style={{ flex: 1 }}>
            <label>{platform === "dxtrade" ? "Username" : "Login ID"}</label>
            <input
              className="inp mono"
              placeholder={platform === "dxtrade" ? "DXtrade username" : "1045755"}
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              inputMode={platform === "mt5" ? "numeric" : "text"}
            />
          </div>
          <div className="field" style={{ flex: 1.4 }}>
            <label>{platform === "dxtrade" ? "Domain" : "Broker server"}</label>
            <input
              className="inp mono"
              placeholder={
                platform === "dxtrade"
                  ? "default"
                  : selectedBroker?.server_examples[0] || "MonetaMarkets-Demo"
              }
              value={server}
              onChange={(e) => setServer(e.target.value)}
            />
            {platform === "mt5" && (
              <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>
                Use the exact server from MT5 (e.g. MonetaMarkets-Demo, no spaces). Enable
                Tools → Options → Community → Python integration in your broker terminal.
              </div>
            )}
          </div>
        </div>

        <div className="field">
          <label>Account password</label>
          <div className="inp-wrap">
            <input
              className="inp mono"
              type={show ? "text" : "password"}
              placeholder="••••••••••"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              style={{ paddingRight: 38 }}
            />
            <button type="button" className="eye" onClick={() => setShow(!show)}>
              <Icon name={show ? "eyeOff" : "eye"} size={16} />
            </button>
          </div>
        </div>

        {platform === "mt5" && brokerSlug === "custom" && (
          <>
            <div className="divider" />
            <button
              type="button"
              className="row spread"
              style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              onClick={() => setAdv(!adv)}
            >
              <span style={{ fontWeight: 600, fontSize: 13 }}>Advanced parameters</span>
              <Icon name={adv ? "chevronUp" : "chevronDown"} size={16} style={{ color: "var(--faint)" }} />
            </button>
            {adv && (
              <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
                <label>Terminal path (terminal64.exe)</label>
                <input
                  className="inp mono"
                  placeholder="C:\Program Files\Moneta Markets MT5 Terminal\terminal64.exe"
                  value={customTerminalPath}
                  onChange={(e) => setCustomTerminalPath(e.target.value)}
                />
              </div>
            )}
          </>
        )}
      </div>
      <div className="row gap10" style={{ marginTop: 18, justifyContent: "flex-end" }}>
        <Link href="/accounts" className="btn btn-ghost">
          Cancel
        </Link>
        <button type="button" className="btn btn-dark" disabled={!valid || saving} onClick={save}>
          {saving ? "Saving…" : "Save & connect"}
        </button>
      </div>
    </div>
  );
}
