"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { Icon, type IconName } from "@/components/icons/Icon";
import { useApp } from "./AppProvider";
import { initials } from "@/lib/format";

const NAV: { path: string; label: string; icon: IconName }[] = [
  { path: "/dashboard", label: "Overview", icon: "dashboard" },
  { path: "/accounts", label: "Trading Accounts", icon: "server" },
  { path: "/copiers", label: "Copier Links", icon: "branch" },
  { path: "/logs", label: "Forensic Logs", icon: "logs" },
  { path: "/risk", label: "Risk Engineering", icon: "shield" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { email, signOut, accounts } = useApp();
  const active = (p: string) =>
    pathname === p || (p !== "/dashboard" && pathname.startsWith(p));

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <BrandLogo nameClassName="" />
      </div>
      <nav className="sb-nav">
        <div className="sb-sec">Control</div>
        {NAV.map((n) => (
          <Link
            key={n.path}
            href={n.path}
            className={`sb-link${active(n.path) ? " active" : ""}`}
          >
            <Icon name={n.icon} size={17} />
            {n.label}
            {n.path === "/logs" && accounts.length > 0 && (
              <span className="badge-mini">live</span>
            )}
          </Link>
        ))}
        <div className="sb-sec">System</div>
        <Link
          href="/settings"
          className={`sb-link${pathname.startsWith("/settings") ? " active" : ""}`}
        >
          <Icon name="settings" size={17} />
          Settings
        </Link>
      </nav>
      <div className="sb-foot">
        <div className="row gap8">
          <div className="av">{initials(email || "CM")}</div>
          <div style={{ minWidth: 0 }}>
            <div className="em">{email || "—"}</div>
            <span className="plan">Pro Plan</span>
          </div>
        </div>
        <button type="button" className="logout" onClick={() => signOut()}>
          Log out
        </button>
      </div>
    </aside>
  );
}

const CRUMB: Record<string, string[]> = {
  "/dashboard": ["Overview"],
  "/accounts": ["Trading Accounts"],
  "/accounts/new": ["Trading Accounts", "Link Account"],
  "/copiers": ["Copier Links"],
  "/copiers/new": ["Copier Links", "New Pipeline"],
  "/risk": ["Risk Engineering"],
  "/logs": ["Forensic Logs"],
  "/settings": ["Settings"],
};

export function Header() {
  const pathname = usePathname();
  const { paused, setPaused, email } = useApp();

  let crumbs = CRUMB[pathname];
  if (!crumbs) {
    if (pathname.startsWith("/accounts/")) crumbs = ["Trading Accounts", "Account"];
    else if (pathname.startsWith("/copiers/")) crumbs = ["Copier Links", "Edit Pipeline"];
    else if (pathname.startsWith("/risk/")) crumbs = ["Risk Engineering", "Account Sentinel"];
    else crumbs = ["Overview"];
  }

  return (
    <header className="header">
      <div className="crumb">
        {crumbs.map((c, i) => (
          <span key={i} className="row gap8">
            {i > 0 && <Icon name="chevronRight" size={14} className="sep" />}
            <span className={i === crumbs.length - 1 ? "cur" : ""}>{c}</span>
          </span>
        ))}
      </div>
      <div className="spacer" />
      <div className="h-right">
        <button
          type="button"
          className="watchdog"
          onClick={() => setPaused(!paused)}
          title={paused ? "Resume log polling" : "Pause log polling"}
          style={{
            cursor: "pointer",
            borderColor: paused ? "var(--warning)" : "var(--border)",
          }}
        >
          {paused ? (
            <>
              <span
                className="bdot"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--warning)",
                }}
              />
              Engine Paused
            </>
          ) : (
            <>
              <span className="dot" />
              Worker Live
            </>
          )}
        </button>
        <button type="button" className="icon-btn">
          <Icon name="bell" size={17} />
          <span className="dot-n" />
        </button>
        <div className="h-av">{initials(email || "CM")}</div>
      </div>
    </header>
  );
}

export function ToastHost() {
  const { toasts } = useApp();
  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 70,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: "var(--dark)",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 3,
            fontSize: 12.5,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 9,
            boxShadow: "var(--shadow-pop)",
            minWidth: 220,
          }}
        >
          <span
            style={{
              color: t.kind === "err" ? "#FF8A8C" : "var(--pulse)",
              display: "flex",
            }}
          >
            <Icon name={t.kind === "err" ? "alert" : "check"} size={15} />
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export function AppShell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Header />
        <div className={`page${wide ? " page-wide" : ""}`}>{children}</div>
      </div>
      <ToastHost />
    </div>
  );
}
