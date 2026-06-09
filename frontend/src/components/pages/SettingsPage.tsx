"use client";

import { Icon } from "@/components/icons/Icon";
import { Toggle } from "@/components/ui";
import Link from "next/link";
import { SymbolMappingsPanel } from "@/components/settings/SymbolMappingsPanel";
import { PageIntro } from "@/components/shell/PageIntro";
import { useApp } from "@/components/shell/AppProvider";

function Row({
  title,
  desc,
  control,
}: {
  title: string;
  desc?: string;
  control: React.ReactNode;
}) {
  return (
    <div
      className="row spread settings-row"
      style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}
    >
      <div style={{ maxWidth: 440 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
        {desc && (
          <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>
            {desc}
          </div>
        )}
      </div>
      <div>{control}</div>
    </div>
  );
}

export default function SettingsPage() {
  const {
    email,
    accounts,
    accountLimit,
    followerLimit,
    subscriptionPlan,
    paused,
    setPaused,
    refreshAll,
  } = useApp();
  const planLabel =
    subscriptionPlan === "free"
      ? "Free"
      : subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1);

  return (
    <div className="page-inner" style={{ maxWidth: 760 }}>
      <PageIntro description="Engine, workspace, and plan configuration." />
      <div className="card" style={{ overflow: "hidden", marginBottom: 16 }}>
        <div className="card-head">
          <Icon name="sliders" size={16} style={{ color: "var(--accent)" }} />
          <h3>Engine</h3>
        </div>
        <Row
          title="Live updates"
          desc="Pause automatic refresh of balances and copy activity."
          control={<Toggle on={!paused} onChange={(v) => setPaused(!v)} />}
        />
        <Row
          title="Refresh all data"
          desc="Reload accounts, copiers, risk profiles, and logs from the API."
          control={
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => refreshAll()}>
              Refresh now
            </button>
          }
        />
      </div>
      <div className="card" style={{ overflow: "hidden", marginBottom: 16 }}>
        <div className="card-head">
          <Icon name="user" size={16} style={{ color: "var(--accent)" }} />
          <h3>Plan</h3>
        </div>
        <Row
          title="Current plan"
          desc={`${planLabel} — ${accountLimit} terminals, ${followerLimit} copier links.`}
          control={
            <span className="badge badge-accent" style={{ fontSize: 12 }}>
              {planLabel}
            </span>
          }
        />
        <Row
          title="Account quota"
          desc={`${accounts.length} of ${accountLimit} terminals in use.`}
          control={
            <Link href="/settings/billing" className="btn btn-ghost btn-sm">
              Billing
            </Link>
          }
        />
      </div>
      <div className="card" style={{ overflow: "hidden", marginBottom: 16 }}>
        <div className="card-head">
          <Icon name="shield" size={16} style={{ color: "var(--accent)" }} />
          <h3>Risk & safety</h3>
        </div>
        <Row
          title="Risk limits"
          desc="Daily loss caps, symbol filters, and account lockouts for followers."
          control={
            <Link href="/risk" className="btn btn-ghost btn-sm">
              Manage risk
            </Link>
          }
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <SymbolMappingsPanel />
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-head">
          <Icon name="lock" size={16} style={{ color: "var(--accent)" }} />
          <h3>Security</h3>
        </div>
        <Row
          title="Signed in as"
          desc={email}
          control={<span className="badge badge-plain">{email.split("@")[0]}</span>}
        />
        <Row
          title="Credential storage"
          desc="Broker passwords are AES-256-GCM encrypted at rest and write-only."
          control={
            <span className="badge badge-ok">
              <span className="bdot" />
              Enforced
            </span>
          }
        />
      </div>
    </div>
  );
}
