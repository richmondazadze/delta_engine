import { DashboardLayout } from "@/components/shell/DashboardLayout";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
