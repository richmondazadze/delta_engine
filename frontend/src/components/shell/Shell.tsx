"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { Icon, type IconName } from "@/components/icons/Icon";
import { useApp } from "./AppProvider";
import { UserMenu } from "./UserMenu";
import { fmtClock } from "@/lib/format";

const NAV: { path: string; label: string; icon: IconName }[] = [
  { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { path: "/accounts", label: "Accounts", icon: "server" },
  { path: "/copiers", label: "Copy engine", icon: "branch" },
  { path: "/logs", label: "Copy log", icon: "logs" },
];

const MORE_NAV: { path: string; label: string; icon: IconName }[] = [
  { path: "/analytics", label: "Performance", icon: "gauge" },
  { path: "/risk", label: "Risk limits", icon: "lock" },
  { path: "/settings", label: "Settings", icon: "settings" },
];

export function Sidebar({
  open,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { subscriptionPlan } = useApp();
  const active = (p: string) =>
    pathname === p || (p !== "/dashboard" && pathname.startsWith(p));

  const close = () => onClose?.();

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="sb-brand">
        <BrandLogo nameClassName="" />
        <button
          type="button"
          className="sb-close-mobile icon-btn"
          onClick={close}
          aria-label="Close menu"
        >
          <Icon name="x" size={16} />
        </button>
      </div>
      <nav className="sb-nav">
        <div className="sb-sec">Menu</div>
        {NAV.map((n) => (
          <Link
            key={n.path}
            href={n.path}
            className={`sb-link${active(n.path) ? " active" : ""}`}
            onClick={close}
          >
            <Icon name={n.icon} size={17} />
            {n.label}
          </Link>
        ))}
        <div className="sb-sec">More</div>
        {MORE_NAV.map((n) => (
          <Link
            key={n.path}
            href={n.path}
            className={`sb-link${pathname.startsWith(n.path) ? " active" : ""}`}
            onClick={close}
          >
            <Icon name={n.icon} size={17} />
            {n.label}
          </Link>
        ))}
      </nav>
      {subscriptionPlan === "admin" && (
        <div className="sb-foot sb-foot-minimal">
          <Link href="/admin/overview" className="sb-ops-link" onClick={close}>
            <Icon name="shield" size={14} />
            Operations console
          </Link>
        </div>
      )}
    </aside>
  );
}

const CRUMB: Record<string, string[]> = {
  "/dashboard": ["Dashboard"],
  "/accounts": ["Accounts"],
  "/accounts/new": ["Accounts", "Link account"],
  "/copiers": ["Copy engine"],
  "/copiers/new": ["Copy engine", "New setup"],
  "/risk": ["Settings", "Risk limits"],
  "/logs": ["Copy log"],
  "/settings": ["Settings"],
  "/settings/billing": ["Settings", "Billing"],
  "/analytics": ["Performance"],
};

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { dashboard } = useApp();
  const panelRef = useRef<HTMLDivElement>(null);
  const activity = dashboard?.recent_activity ?? [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={panelRef} className="notif-panel card">
      <div className="card-head" style={{ position: "sticky", top: 0, background: "var(--canvas)" }}>
        <Icon name="bell" size={15} />
        <h3 style={{ fontSize: 13 }}>Notifications</h3>
        <div className="grow" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          Close
        </button>
      </div>
      {activity.length === 0 ? (
        <div className="faint" style={{ padding: 16, fontSize: 12.5 }}>
          No copy events today. Trades will show up here as they happen.
        </div>
      ) : (
        activity.slice(0, 12).map((a) => (
          <div
            key={a.id}
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              fontSize: 12.5,
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 2 }}>{a.message}</div>
            <div className="faint mono" style={{ fontSize: 11 }}>
              {fmtClock(new Date(a.at))}
            </div>
          </div>
        ))
      )}
      <div className="card-foot">
        <Link href="/logs" className="link-action" onClick={onClose}>
          Open copy log
        </Link>
      </div>
    </div>
  );
}

export function Header({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const pathname = usePathname();
  const { paused, setPaused, workerHealthy, dashboard } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = (dashboard?.today?.copies ?? 0) + (dashboard?.today?.failed ?? 0);

  let crumbs = CRUMB[pathname];
  if (!crumbs) {
    if (pathname.startsWith("/accounts/")) crumbs = ["Accounts", "Account"];
    else if (pathname.startsWith("/copiers/")) crumbs = ["Copy engine", "Edit setup"];
    else if (pathname.startsWith("/risk/")) crumbs = ["Settings", "Risk limits"];
    else crumbs = ["Dashboard"];
  }

  return (
    <header className="header">
      <button
        type="button"
        className="mobile-menu-btn icon-btn"
        onClick={onMenuOpen}
        aria-label="Open menu"
      >
        <Icon name="menu" size={18} />
      </button>
      <div className="crumb">
        {crumbs.map((c, i) => (
          <span key={i} className="row gap8 crumb-part">
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
          title={paused ? "Resume live updates" : "Pause live updates"}
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
              <span className="watchdog-label">Updates paused</span>
            </>
          ) : workerHealthy ? (
            <>
              <span className="dot" />
              <span className="watchdog-label">Copy service online</span>
            </>
          ) : (
            <>
              <span
                className="bdot"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--muted-fg)",
                }}
              />
              <span className="watchdog-label">Copy service offline</span>
            </>
          )}
        </button>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
          >
            <Icon name="bell" size={17} />
            {unread > 0 && <span className="dot-n" />}
          </button>
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
        </div>
        <UserMenu />
      </div>
    </header>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  const active = (p: string) =>
    pathname === p || (p !== "/dashboard" && pathname.startsWith(p));

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary">
      {NAV.map((n) => (
        <Link
          key={n.path}
          href={n.path}
          className={`mbn-link${active(n.path) ? " active" : ""}`}
        >
          <Icon name={n.icon} size={20} />
          <span>{n.label.split(" ")[0]}</span>
        </Link>
      ))}
    </nav>
  );
}

export function ToastHost() {
  const { toasts } = useApp();
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className="toast-item">
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
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("nav-open", navOpen);
    return () => document.body.classList.remove("nav-open");
  }, [navOpen]);

  return (
    <div className="app">
      {navOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
      )}
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="main">
        <Header onMenuOpen={() => setNavOpen(true)} />
        <div className={`page${wide ? " page-wide" : ""}`}>{children}</div>
      </div>
      <MobileBottomNav />
      <ToastHost />
    </div>
  );
}
