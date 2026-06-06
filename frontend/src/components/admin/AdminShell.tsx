"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icons/Icon";
import { BrandLogo } from "@/components/BrandLogo";
import { createClient } from "@/lib/supabase/client";

const NAV: { path: string; label: string; icon: IconName }[] = [
  { path: "/admin/overview", label: "Platform overview", icon: "dashboard" },
  { path: "/admin/users", label: "Customers", icon: "activity" },
  { path: "/admin/infrastructure", label: "Workers & sessions", icon: "server" },
  { path: "/admin/executions", label: "Global executions", icon: "logs" },
  { path: "/admin/system", label: "System health", icon: "gauge" },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("nav-open", navOpen);
    return () => document.body.classList.remove("nav-open");
  }, [navOpen]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="admin-app">
      {navOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside className={`admin-sidebar${navOpen ? " open" : ""}`}>
        <div className="admin-brand">
          <BrandLogo nameClassName="" />
          <span className="admin-badge">Operations</span>
          <button
            type="button"
            className="sb-close-mobile icon-btn"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <nav className="admin-nav">
          {NAV.map((n) => (
            <Link
              key={n.path}
              href={n.path}
              className={`admin-link${pathname.startsWith(n.path) ? " active" : ""}`}
              onClick={() => setNavOpen(false)}
            >
              <Icon name={n.icon} size={16} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="admin-foot">
          <div className="admin-foot-email">{email}</div>
          <Link href="/dashboard" className="admin-link subtle" onClick={() => setNavOpen(false)}>
            <Icon name="arrowRight" size={14} />
            Trader app
          </Link>
          <button type="button" className="admin-link subtle" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="admin-main-wrap">
        <div className="admin-mobile-bar">
          <button
            type="button"
            className="mobile-menu-btn icon-btn"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" size={18} />
          </button>
          <span className="admin-mobile-title">Operations</span>
        </div>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
