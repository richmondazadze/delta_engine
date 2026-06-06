import { AdminGate } from "@/components/admin/AdminGate";

export const metadata = {
  title: "Operations — CopyMorphic Admin",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
