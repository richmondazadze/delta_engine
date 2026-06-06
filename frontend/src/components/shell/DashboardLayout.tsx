"use client";

import { usePathname } from "next/navigation";
import { AppProvider, useApp } from "@/components/shell/AppProvider";
import { AppShell } from "@/components/shell/Shell";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { loading } = useApp();
  const pathname = usePathname();
  const wide = pathname.startsWith("/logs");

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
        }}
      >
        Loading workspace…
      </div>
    );
  }
  return <AppShell wide={wide}>{children}</AppShell>;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </AppProvider>
  );
}
